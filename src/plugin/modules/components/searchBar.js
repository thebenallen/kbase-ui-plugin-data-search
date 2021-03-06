define([
    'jquery',
    'knockout-plus',
    'kb_common/html',
    './searchHelp',
], function (
    $,
    ko,
    html,
    SearchHelpComponent
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        button = t('button'),
        input = t('input');

    /*
    params are:
        searchInput
        searchHistory
    */
    function viewModel(params) {
        var subscriptions = ko.kb.SubscriptionManager.make();
        // TODO: link to params
        var searchInput = params.searchInput;
        var searchHistory = params.searchHistory;
        var inputWarnings = params.inputWarnings;
        var forceSearch = params.forceSearch;

        // HISTORY

        var showHistory = ko.observable(false);

        function doToggleHistory() {
            showHistory(!showHistory());
        }

        // WARNINGS
        // E.g. stop words entered, etc.

        // var showWarnings = ko.observable(false);
        var warnings = ko.observableArray([
        ]);
        subscriptions.add(inputWarnings.subscribe(function (newValue) {
            if (newValue.length === 0) {
                warnings.removeAll();
            }
            newValue.forEach(function (warning) {
                warnings.push(warning);
            });
        }));
        function doClearWarnings() {
            warnings.removeAll();
        }

        // SEARCH INPUT

        // This is the obervable in the actual search input control; it is synced
        // _from_ the searchInput on the parent model, so it can pick up any changes
        // to it, but changes to the search input control are done through
        // a subscription.
        var searchControlValue = ko.observable().syncFrom(params.searchInput);

        // When it is updated by either of those methods, we save
        // it in the search history, and also forward the value to
        // the search query.
        subscriptions.add(searchInput.subscribe(function (newValue) {
            // add to history if not already there...
            params.searchInput(newValue);
        }));

        function useFromHistory(data) {
            showHistory(false);
            searchControlValue(data);
            searchInput(data);
        }


        var searchInputClass = ko.pureComputed(function () {
            if (searchControlValue() !== searchInput()) {
                return styles.classes.modifiedFilterInput;
            }

            if (searchInput()) {
                return styles.classes.activeFilterInput;
            }

            return null;
        });

        // ACTIONS

        function doHelp() {
            params.overlayComponent({
                name: SearchHelpComponent.name(),
                params: {},
                viewModel: {}
            });
        }

        function doClearInput() {
            searchControlValue('');
            doRunSearch();
        }

        function doRunSearch() {
            searchInput(searchControlValue());
            forceSearch(new Date().getTime());
        }

        function doKeyUp(data, ev) {
            if (warnings().length > 0) {
                doClearWarnings();
            }
            if (ev.key) {
                if (ev.key === 'Enter') {
                    doRunSearch();
                }
            } else if (ev.keyCode) {
                if (ev.keyCode === 13) {
                    doRunSearch();
                }
            }
        }

        // hack to ensure that clicking in side the history control does not close it!
        var historyContainerId = html.genId();

        function clickListener (ev) {
            var elementType = ev.target.getAttribute('data-type');
            if (['history-toggle-button', 'history-toggle-button-icon', 'history-item'].indexOf(elementType) == -1) {
                showHistory(false);
            }
            return true;
        }

        document.addEventListener('click', clickListener, true);

        // LIFECYCLE

        function dispose() {
            if (clickListener) {
                document.removeEventListener('click', clickListener, true);
            }
            subscriptions.dispose();
        }

        return {
            // The top level search is included so that it can be
            // propagated.

            // UN-UN-COMMENT
            // search: params.search,

            // And we break out fields here for more natural usage (or not??)
            searchControlValue: searchControlValue,

            // UN-UN-COMMENT
            // searching: params.search.searching,
            searching: ko.observable(false),

            showHistory: showHistory,
            doToggleHistory: doToggleHistory,

            useFromHistory: useFromHistory,
            searchHistory: searchHistory,
            searchInputClass: searchInputClass,

            historyContainerId: historyContainerId,

            // showWarnings: showWarnings,
            warnings: warnings,
            doClearWarnings: doClearWarnings,

            // ACTIONS
            doHelp: doHelp,
            doRunSearch: doRunSearch,
            doKeyUp: doKeyUp,
            doClearInput: doClearInput,

            // LIFECYCLE
            dispose: dispose
        };
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px',
        },
        activeFilterInput: {
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        },
        modifiedFilterInput: {
            backgroundColor: 'rgba(255, 245, 158, 1)',
            color: '#000'
        },
        historyContainer: {
            display: 'block',
            position: 'absolute',
            border: '1px silver solid',
            backgroundColor: 'rgba(255,255,255,0.9)',
            zIndex: '3',
            top: '100%',
            left: '0',
            right: '0'
        },
        historyItem: {
            css: {
                padding: '3px',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'silver'
                }
            }
        },
        addonButton: {
            css: {
                color: 'black',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'silver'
                },
                active: {
                    backgroundColor: 'gray',
                    color: 'white'
                }
            }
        },
        addonButtonDisabled: {
            css: {
                color: 'gray',
                cursor: 'normal'
            }
        },
        warningContainer: {
            display: 'block',
            position: 'absolute',
            border: '1px silver solid',
            // from bootstrap's bg-warning default color
            backgroundColor: '#fcf8e3',
            zIndex: '3',
            top: '100%',
            left: '0',
            right: '0'
        },
    });
    function buildSearchBar() {
        /*
            Builds the search input area using bootstrap styling and layout.
        */
        return div({
            class: 'form'
        }, div({
            class: 'input-group'
        }, [
            div({
                class: 'input-group-addon',
                title: 'Click me to run the search',
                style: {
                    cursor: 'pointer',
                    borderRadius: '4px',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                },
                dataBind: {
                    click: 'doRunSearch'
                }
            }, span({
                style: {
                    display: 'inline-block',
                    width: '2em',
                    textAlign: 'center'
                }
            }, span({
                class: 'fa',
                style: {
                    fontSize: '100%',
                    color: '#000'
                },
                dataBind: {
                    css: {
                        'fa-search': '!searching()',
                        'fa-spinner fa-pulse': 'searching()'
                    }
                }
            }))),
            div({
                class: 'form-control',
                style: {
                    display: 'inline-block',
                    width: '100%',
                    position: 'relative',
                    padding: '0',
                    border: 'none'
                }
            }, [
                input({
                    class: 'form-control',
                    title: 'Enter one or more search terms here, the press Enter/Return or click the search icon',               
                    dataBind: {
                        textInput: 'searchControlValue',
                        // value: 'searchInput',
                        hasFocus: true,
                        // css: 'searchInput() ? "' + styles.classes.activeFilterInput + '" : null',
                        css: 'searchInputClass',
                        event: {
                            keyup: 'doKeyUp'
                        }
                    },
                    dataKBTesthookInput: 'search-input',
                    placeholder: 'Search KBase Data'
                }),
                '<!-- ko if: showHistory -->',
                div({
                    class: styles.classes.historyContainer,
                    dataBind: {
                        attr: {
                            id: 'historyContainerId'
                        }
                    }
                }, [
                    '<!-- ko if: searchHistory().length > 0 -->',
                    '<!-- ko foreach: searchHistory -->',                    
                    div({
                        dataBind: {
                            text: '$data',
                            click: '$component.useFromHistory'
                        },
                        class: styles.classes.historyItem,
                        dataType: 'history-item'
                    }),
                    '<!-- /ko -->',
                    '<!-- /ko -->',
                    '<!-- ko ifnot: searchHistory().length > 0 -->',
                    p({
                        style: {
                            fontStyle: 'italic'
                        }
                    }, 'no items in history yet - Search!'),
                    '<!-- /ko -->',
                ]),
                '<!-- /ko -->',
                '<!-- ko if: warnings().length && !showHistory() -->',
                div({
                    class: styles.classes.warningContainer,
                }, [
                   
                    div({
                        dataBind: {
                            foreach: 'warnings'
                        }
                    }, div({
                        style: {
                            marginTop: '2px',
                            marginBottom: '2px',
                            padding: '3px'
                        },
                        dataBind: {
                            text: '$data'
                        }
                    })),
                    div({
                        style: {
                            borderTop: '1px solid rgba(200,200,200,0.5)',
                            padding: '3px',
                            textAlign: 'center'
                        }
                    }, [
                        button({
                            class: 'btn btn-default btn-sm',
                            type:  'button',
                            dataBind: {
                                click: 'doClearWarnings'
                            }
                        }, 'Clear')
                    ])
                ]),
                '<!-- /ko -->'
            ]),
            div({
                class: 'input-group-addon ' + styles.classes.addonButton,
                title: 'Click me to clear the search input area to the left',
                dataBind: {
                    click: 'searchControlValue() ? doClearInput : null',
                    css: 'searchControlValue() ? "' + styles.classes.addonButton + '" : "' + styles.classes.addonButtonDisabled + '"'
                }
            }, span({
                class: 'fa fa-times'
            })),
            div({
                class: 'input-group-addon ' + styles.classes.addonButton,
                title: 'Click me to see the last 10 unique search inputs',
                dataType: 'history-toggle-button',
                dataBind: {
                    click: 'doToggleHistory',
                    style: {
                        'background-color': 'showHistory() ? "silver" : null'
                    }
                }
            }, span({
                dataType: 'history-toggle-button-icon',
                class: 'fa fa-history'
            })),
            div({
                class: 'input-group-addon '  + styles.classes.addonButton,
                title: 'Click me to see help for Data Search',
                dataBind: {
                    click: 'doHelp'
                }
            }, span({
                class: 'fa fa-question'
            }))
        ]));
    }

    function template() {
        return div({
            class: styles.classes.component,
            dataKBTesthookComponent: 'search-bar'
        }, [
            div({
                styles: {
                    flex: '1 1 0px'
                }
            }, buildSearchBar())
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});