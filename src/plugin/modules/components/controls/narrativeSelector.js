define([
    'knockout',
    'kb_ko/KO',
    'kb_ko/lib/generators',
    'kb_ko/lib/subscriptionManager',
    'kb_common/html',
    '../../lib/data'
], function (
    ko,
    KO,
    gen,
    SubscriptionManager,
    html,
    Data
) {
    'use strict';

    let t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        select = t('select');

    function viewModel(params, componentInfo) {
        let context = ko.contextFor(componentInfo.element);
        let runtime = context['$root'].runtime;

        let subscriptions = new SubscriptionManager;

        let data = Data.make({
            runtime: runtime
        });

        let selectedNarrative = ko.observable();
        selectedNarrative.syncWith(params.selectedNarrative);

        let sortOptions = [
            {
                label: 'Title',
                value: 'title',
                selected: ko.observable(false)
            },
            // {
            //     label: 'User',
            //     value: 'username',
            //     selected: ko.observable(false)
            // },
            {
                label: 'Date',
                value: 'date',
                selected: ko.observable(false)
            },
        ];
        let sortOption = ko.observable('date');

        let sortDirection = ko.observable('descending');

        function doToggleSort() {
            sortDirection(sortDirection() === 'descending' ? 'ascending' : 'descending');
        }

        // TODO: a ready() flag so we can disable the control until data is loaded.

        let ready = ko.observable(false);
        let narratives = ko.observableArray([]);
        let error = ko.observable();
        data.getWritableNarratives()
            .then(function (writableNarratives) {
                writableNarratives.forEach(function (narrative) {
                    narratives.push({
                        title: narrative.metadata.narrative_nice_name,
                        ref: [String(narrative.id), narrative.metadata.narrative].join('/'),
                        owner: narrative.owner,
                        realName: narrative.ownerRealName,
                        date: narrative.modDate,
                        searchable: {
                            title: narrative.metadata.narrative_nice_name.toLowerCase(),
                            owner: narrative.owner,
                            realName: narrative.ownerRealName.toLowerCase()
                        },
                        sortable: {
                            title: narrative.metadata.narrative_nice_name.toLowerCase(),
                            owner: narrative.owner,
                            date: narrative.modDate.getTime()
                        },
                        active: ko.observable(false),
                        selected: ko.observable(false)
                    });
                });
                ready(true);
            })
            .catch(function (err) {
                error(err);
            });

        let inputValue = ko.observable().extend({rateLimit: 150});

        let loading = ko.observable(false);

        let searchExpression = ko.pureComputed(function () {
            if (!inputValue() || inputValue().length < 2) {
                return null;
            }
            return inputValue();
        });

        function cmp(a, b) {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        }

        let sortDir = ko.pureComputed(function () {
            if (sortDirection() === 'ascending') {
                return 1;
            } else {
                return -1;
            }
        }); 

        // var narrativesFiltered = narratives            
        //     .filter(function (narrative) {
        //         if (!searchExpression()) {
        //             return true;
        //         }
                
        //         var searchString = searchExpression().toLowerCase();
        //         return Object.keys(narrative.searchable).some(function (key) {
        //             return (narrative.searchable[key].indexOf(searchString) >= 0); 
        //         });
        //     });

        // var narrativesSorted= ko.pureComputed(function () {
        //     narrativesFiltered()
        //         .sort(function (a, b) {

        //         })
        // });

        let narrativesFiltered = ko.pureComputed(function () {
            var search = searchExpression();

            var nar;
            if (!search) {
                nar = narratives();
            } else {
                var searchString = search.toLowerCase();
                nar = narratives()
                    .filter(function (narrative) {
                        return Object.keys(narrative.searchable).some(function (key) {
                            return (narrative.searchable[key].indexOf(searchString) >= 0); 
                        });
                    });
            }

            var sortField = sortOption();

            return nar
                .sort(function (a, b) {
                    var dir = sortDir();
                    switch (sortField) {
                    case 'title':                        
                        return dir * cmp(a.sortable.title, b.sortable.title);
                    case 'username':
                        return dir * cmp(a.sortable.username, b.sortable.username);
                    case 'date':
                    default:
                        return dir * cmp(a.sortable.date, b.sortable.date);                    
                    }
                });
        });


        var totalCount = ko.pureComputed(function () {
            return narratives().length;
        });

        var tooManyResults = ko.observable(false);
        var searchCount = ko.observable();

        var isSearching = ko.observable(false);

        function doSelectValue(selected) {
            if (selected.selected()) {
                selected.selected(false);
                selectedNarrative(null);
                return;
            } 
            narrativesFiltered().forEach(function (narrative) {
                narrative.selected(false);
            });
            selectedNarrative(selected.ref);
            selected.selected(true);
        }

        function doActivate(selected) {
            selected.active(true);
        }

        function doDeactivate(selected) {
            selected.active(false);
        }

        function doClearSearch() {
            inputValue('');
            // inputValue.reset();
            // restoring the value should be all we need to do... 
        }

        function dispose() {
            subscriptions.dispose();
        }

        return {
            loading: loading,
            inputValue: inputValue,
            narrativesFiltered: narrativesFiltered,
            totalCount: totalCount,
            searchCount: searchCount,
            isSearching: isSearching,
            doSelectValue: doSelectValue,
            doClearSearch: doClearSearch,
            tooManyResults: tooManyResults,
            sortOptions: sortOptions,
            sortOption: sortOption,
            sortDirection: sortDirection,
            ready: ready,
        
            doDeactivate: doDeactivate,
            doActivate: doActivate,
            doToggleSort: doToggleSort,

            dispose: dispose
        };
    }

    var styles = html.makeStyles({
        component: {
            css: {
            },
            inner: {
                '.-row.-active': {
                    css: {
                        backgroundColor: 'silver'
                    }
                }
            }
        },
        container: {
            css: {
            }
        },
        selectedRow: {
            css: {
                backgroundColor: 'silver'
            }
        },
        hoverRow: {
            css: {
                backgroundColor: 'silver'
            }
        },
        addonButton: {
            css: {

            },
            pseudoClasses: {
                hover: {
                    backgroundColor: 'rgba(200,200,200,0.5)'
                },
                active: {
                    backgroundColor: 'rgba(200,200,200,1)'
                }
            }
        }
    });

    function template() {
        return div({
            style: {},
            class: styles.classes.component
        }, div({
            class: styles.classes.container
        }, [
            div({
                dataBind: {
                    if: 'loading()'
                }
            }, html.loading()),
            div({
                dataBind: {
                    ifnot: 'loading()'
                }
            }, [
                div({
                    width: '100%'
                }, div({
                    style: {
                        display: 'flex',
                        flexDirection: 'row'
                    }
                }, [
                    input({
                        class: 'form-control',
                        style: {
                            flex: '1'
                        },
                        dataBind: {
                            value: 'inputValue',
                            valueUpdate: '"input"'
                        }
                    }),
                    div({
                        style: {
                            flex: '0 0 auto'
                        }
                    }, select({
                        class: 'form-control',
                        style: {
                            flex: '0 0 auto'
                        },
                        dataBind: {
                            value: 'sortOption',
                            options: 'sortOptions',
                            optionsValue: '"value"',
                            optionsText: '"label"'
                        }
                    })),
                    span({
                        class: ['input-group-addon', 'fa', styles.classes.addonButton],
                        style: {
                            display: 'block',
                            flex: '0 0 auto',
                            width: 'auto'
                        },
                        dataBind: {
                            class: 'sortDirection() === "ascending" ? "fa-sort-asc" : "fa-sort-desc"',
                            click: 'doToggleSort'
                        }
                    }),
                   
                    span({
                        class: ['input-group-addon', 'fa', 'fa-times', styles.classes.addonButton],
                        style: {
                            cursor: 'pointer',
                            width: 'auto'
                        },
                        dataBind: {
                            click: 'doClearSearch',
                            enable: 'inputValue'
                        }
                    })
                ])),
                div({
                    style: {
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '20em'
                    }
                }, [
                    '<!-- ko ifnot: ready -->',
                    div({
                        style: {
                            textAlign: 'center',
                            margin: '20px'
                        }
                    }, html.loading('Loading data')),
                    '<!-- /ko -->',
                    '<!-- ko if: ready -->',
                    div({
                        style: {
                            borderTop: '1px silver solid',
                            borderLeft: '1px silver solid',
                            borderRight: '1px silver solid',
                            backgroundColor: '#EEE',
                            zIndex: '100',
                            padding: '4px',
                            width: '100%',
                            flex: '0 0 auto'
                        }
                    }, [
                        div({
                            style: {
                                flex: '0 0 auto'
                            }
                        }, [
                            'Showing ',
                            gen.if('narrativesFiltered().length === totalCount()', 
                                span([
                                    'all ', 
                                    span({
                                        dataBind: {
                                            typedText: {
                                                value: 'totalCount',
                                                type: '"number"',
                                                format: '"0,0"'
                                            }
                                        }
                                    }),
                                    ' writable narratives'
                                ]),
                                span([
                                    span({
                                        dataBind: {
                                            text: 'narrativesFiltered().length'
                                        }
                                    }),
                                    ' out of ',
                                    span({
                                        dataBind: {
                                            text: 'totalCount'
                                        }
                                    }),
                                    ' writable narratives'
                                ]))
                        ])
                    ]),
                    div({
                        dataBind: {
                            foreach: {
                                data: 'narrativesFiltered',
                                includeDestroyed: 'false'
                            }
                        },
                        style: {
                            border: '1px silver solid',
                            backgroundColor: 'white',
                            zIndex: '100',
                            width: '100%',
                            overflow: 'auto',
                            flex: '1'
                        }
                    }, div({
                        class: '-row',
                        style: {
                            padding: '4px',
                            cursor: 'pointer',
                            borderBottom: '1px silver solid'
                        },
                        dataBind: {
                            click: '$parent.doSelectValue',
                            class: '[($data && $data.active && active() ? "' + styles.classes.hoverRow + '" : ""), ($data && $data.selected && selected() ? "' + styles.classes.selectedRow + '" : "")].join(" ")',
                            event: {
                                mouseover: '$parent.doActivate',
                                mouseout: '$parent.doDeactivate'
                            }
                        }
                    }, [
                        div({
                            style: {
                                fontWeight: 'bold'
                            },
                            dataBind: {
                                text:  'title'
                            }
                        }),
                        div({
                            style: {
                                display: 'flex',
                                flexDirection: 'row'
                            }
                        }, [
                            div({
                                style: {
                                    flex: '2'
                                },
                                dataBind: {
                                    text: 'realName'
                                }
                            }),
                            div({
                                style: {
                                    flex: '1'
                                },
                                dataBind: {
                                    text: 'owner'
                                }
                            }),
                            div({
                                style: {
                                    flex: '1'
                                },
                                dataBind: {
                                    typedText: {
                                        value: 'date',
                                        type: '"date"',
                                        format: '"MM/DD/YYYY"'
                                    }
                                }
                            })
                        ])
                    ])),
                    '<!-- /ko -->'
                ]),
                div({
                    class: 'text-warning',
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        if: 'tooManyResults()'
                    }
                }, [
                    'Too many matches (',
                    span({ dataBind: { text: 'searchCount' } }),
                    ') to display -- please enter more in order to narrow your results.'
                ]),
                div({
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        if: '!tooManyResults() && narrativesFiltered().length === 0 && inputValue() && inputValue().length < 2'
                    }
                }, [
                    'Please enter two or more letters above to search for your research or educational organization. '
                ]),
                div({
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        if: '!tooManyResults() && narrativesFiltered().length === 0 && inputValue() && inputValue().length >= 2'
                    }
                }, [
                    'Nothing matched your entry. You may leave it as is to use this value in your profile, ',
                    'or try different text to match your organization.'
                ])
            ])
        ]));
    }

    function component() {
        return {
            viewModel: {
                createViewModel: viewModel
            },
            template: template(),
            stylesheet: styles.sheet
        };
    }
    return KO.registerComponent(component);
});