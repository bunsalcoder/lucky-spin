import apiClient from './api';

declare global {
    interface Window {
        mos: any;
    }
}

let appKey: string = import.meta.env.VITE_MOS_APP_KEY || '';
let isAuthenticating = false;
let mosLoginInProgress = false;

let mosLoginRetryCount = 0;
const MAX_MOS_LOGIN_RETRIES = 3;

const handleMOSLogin = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (mosLoginInProgress) {
            resolve();
            return;
        }

        if (!window.mos) {
            if (mosLoginRetryCount < MAX_MOS_LOGIN_RETRIES) {
                mosLoginRetryCount++;
                setTimeout(() => handleMOSLogin().then(resolve).catch(reject), 1000);
            } else {
                mosLoginInProgress = false;
                reject(new Error('MOS SDK not available after maximum retries'));
            }
            return;
        }

        mosLoginInProgress = true;
        mosLoginRetryCount = 0;

        try {
            window.mos
                .login(appKey)
                .then(async (res: any) => {
                    const code = res.code || (res.data && res.data.code);
                    if (!code) {
                        if (mosLoginRetryCount < MAX_MOS_LOGIN_RETRIES) {
                            mosLoginRetryCount++;
                            mosLoginInProgress = false;
                            setTimeout(() => handleMOSLogin().then(resolve).catch(reject), 2000);
                        } else {
                            mosLoginInProgress = false;
                            reject(
                                new Error('Failed to get code from MOS login after maximum retries')
                            );
                        }
                        return;
                    }

                    const userInfo = await window.mos.getUserInfo();
                    const contactInfo = await window.mos.getUserContactInfo();
                    const { firstName, lastName } = userInfo;
                    const { dialCode, phone } = contactInfo;
                    const username = `${firstName} ${lastName}`;

                    const body: any = {
                        code,
                        username
                    };

                    if (dialCode && phone) {
                        const contact = `${dialCode}${phone}`;
                        body.phoneNumber = contact;
                    }

                    const { data } = await apiClient.post('/auth/miniAppLogin', body);

                    const { token, openId } = data;

                    // Ensure token is set before proceeding
                    localStorage.setItem('luckyWheelOpenId', openId);
                    localStorage.setItem('luckyWheelToken', token);
                    localStorage.setItem('luckyWheelUsername', username);
                    localStorage.setItem('isLuckyWheelMosLogin', 'true');

                    // Verify token is set
                    if (!token) {
                        throw new Error('No token received from authentication');
                    }

                    mosLoginInProgress = false;
                    mosLoginRetryCount = 0;
                    resolve();
                })
                .catch((err: any) => {
                    if (mosLoginRetryCount < MAX_MOS_LOGIN_RETRIES) {
                        mosLoginRetryCount++;
                        mosLoginInProgress = false;
                        setTimeout(() => handleMOSLogin().then(resolve).catch(reject), 3000);
                    } else {
                        mosLoginInProgress = false;
                        reject(new Error('MOS login failed after maximum retries'));
                    }
                });
        } catch (error) {
            mosLoginInProgress = false;
            reject(error);
        }
    });
};

const handleOpenIDLogin = async (): Promise<void> => {
    const openId = localStorage.getItem('luckyWheelOpenId');

    if (!openId) {
        throw new Error('OpenID not found');
    }

    try {
        const { data } = await apiClient.post('/auth/loginWithOpenId', { openId });
        localStorage.removeItem('luckyWheelToken');
        localStorage.setItem('luckyWheelToken', data.token);

        // Verify token is set
        if (!data.token) {
            throw new Error('No token received from OpenID login');
        }

        return data;
    } catch (error) {
        localStorage.removeItem('luckyWheelOpenId');
        throw error;
    }
};

export const initializeLogin = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (isAuthenticating) {
            resolve();
            return;
        }

        isAuthenticating = true;
        const openId = localStorage.getItem('luckyWheelOpenId');

        if (openId) {
            handleOpenIDLogin()
                .then(() => {
                    isAuthenticating = false;
                    resolve();
                })
                .catch(async (error) => {
                    try {
                        await handleMOSLogin();
                        isAuthenticating = false;
                        resolve();
                    } catch (mosError) {
                        isAuthenticating = false;
                        reject(mosError);
                    }
                });
        } else {
            handleMOSLogin()
                .then(() => {
                    isAuthenticating = false;
                    resolve();
                })
                .catch((error) => {
                    isAuthenticating = false;
                    reject(error);
                });
        }
    });
};

export const getToken = (): string | null => {
    return localStorage.getItem('luckyWheelToken');
};

export const getOpenId = (): string | null => {
    return localStorage.getItem('luckyWheelOpenId');
};

export const getUsername = (): string | null => {
    return localStorage.getItem('luckyWheelUsername');
};

export const clearToken = (): void => {
    localStorage.removeItem('luckyWheelToken');
    localStorage.removeItem('luckyWheelOpenId');
    localStorage.removeItem('luckyWheelUsername');
    localStorage.removeItem('isLuckyWheelMosLogin');
    isAuthenticating = false;
    mosLoginInProgress = false;
    mosLoginRetryCount = 0;
};

// Refresh token using OpenID
export const refreshToken = async (): Promise<boolean> => {
    const openId = localStorage.getItem('luckyWheelOpenId');

    if (!openId) {
        console.log('No OpenID found for token refresh');
        return false;
    }

    try {
        const { data } = await apiClient.post('/auth/loginWithOpenId', { openId });
        console.log('Token refresh successful:', data);

        const { token, username } = data;
        localStorage.setItem('luckyWheelToken', token);
        localStorage.setItem('luckyWheelUsername', username);

        return true;
    } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
    }
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export const waitForAuthentication = async (timeout: number = 5000): Promise<boolean> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (isAuthenticated()) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
};

export const setAppKey = (key: string): void => {
    appKey = key;
};

export const getAppKey = (): string => {
    return appKey;
};

export default {
    initializeLogin,
    getToken,
    getOpenId,
    getUsername,
    clearToken,
    refreshToken,
    isAuthenticated,
    waitForAuthentication,
    setAppKey,
    getAppKey
};
