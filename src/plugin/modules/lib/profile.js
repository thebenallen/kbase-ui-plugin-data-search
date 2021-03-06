define([
    'kb_common/jsonRpc/genericClient',
    'kb_common/props'
], function (
    GenericClient,
    Props
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;

        var profileService = new GenericClient({
            url: runtime.config('services.UserProfile.url'),
            token: runtime.service('session').getAuthToken(),
            module: 'UserProfile'
        });

        function updateUserProfile(profileUpdate) {
            return profileService.callFunc('update_user_profile', [profileUpdate])
                .then(function () {
                    return [true, null];
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:update_user_profile',
                        code: 'error-in-call',
                        message: 'An error occurred attempting to update the user profile: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            profileUpdate: profileUpdate
                        }
                    }];
                });
        }

        function sameArray(a1, a2) {
            if (a1.length !== a2.length) {
                return false;
            }
            for (var i = 0; i < a1.length; i += 1) {
                if (a1[i] !== a2[i]) {
                    return false;
                }
            }
            return true;
        }

        function saveHistory(name, history) {
            var username = runtime.service('session').getUsername();

            var key = ['data-search', 'settings', 'history', name];

            return profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var prefs = Props.make({ data: profile.getItem('profile.plugins', {}) });

                    if (prefs.hasItem(key)) {
                        if (sameArray(prefs.getItem(key).history, history)) {
                            return [true, null];
                        }
                    }

                    prefs.setItem(key, {
                        history: history,
                        time: new Date().getTime()
                    });

                    var profileUpdate = {
                        profile: {
                            profile: {
                                plugins: prefs.debug()
                            },
                            user: profile.getItem('user')
                        }
                    };

                    // Don't want to really replace, but update_user_profile only 
                    return updateUserProfile(profileUpdate);
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to save the user preferences: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        function firstSuccess(array, fun) {
            for (var i = 0; i < array.length; i += 1) {
                var result = fun(array[i]);
                if (result) {
                    return result;
                }
            }
        }

        function getHistory(name) {
            var username = runtime.service('session').getUsername();

            var key = ['profile', 'plugins', 'data-search', 'settings', 'history', name];

            return profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var keys = [key];

                    var history= firstSuccess(keys, function (key) {
                        return profile.getItem(key);
                    });

                    if (!history) {
                        history = {
                            history: [],
                            time: new Date().getTime()
                        };
                    } else if (!(history.history instanceof Array)) {
                        history = {
                            history: [],
                            time: new Date().getTime()
                        };
                    }
                    return [history.history, null];
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to get the user preferences: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        return Object.freeze({
            getHistory: getHistory,
            saveHistory: saveHistory
        });
    }

    return Object.freeze({
        make: factory
    });
});