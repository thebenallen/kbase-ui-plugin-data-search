define([
    '../ObjectIndexBase'
], function (
    ObjectIndexBase
) {
    'use strict';

    const indexId = 'Assembly';
    const indexVersion = 1;
    const kbaseTypeModule = 'KBaseGenomeAnnotations';
    const kbaseTypeId = 'Assembly';
    const label = 'Assembly';

    const detailFieldDefs = [
        {
            id: 'name',
            label: 'Name'
        }, {
            id: 'contigCount',
            label: '# Contigs',
            type: 'number',
            format: '0,0'
        }, {
            id: 'dnaSize',
            label: 'DNA Size',
            type: 'number',
            format: '0,0'
        }, {
            id: 'gcContent',
            label: 'GC Content',
            type: 'number',
            format: '0.000%'
        }, {
            id: 'externalSourceId',
            label: 'External Source ID'
        }
    ];

    const searchFields = {
        name: {
            label: 'Name',
            type: 'string'
        },
        dna_size: {
            label: 'DNA Size',
            type: 'integer'
        },
        gc_content: {
            label: 'GC Content',
            type: 'float'
        },
        external_source_id: {
            label: 'External Source ID',
            type: 'string'
        },
        contigs: {
            label: 'Contigs',
            type: 'integer'
        }
    };
    
    const sortFields = [
        {
            key: 'name',
            label: 'Name'
        },
        {
            key: 'dna_size',
            label: 'DNA Size'
        },
        {
            key: 'gc_content',
            label: 'GC Content'
        }
    ];


    class AssemblyIndex1 extends ObjectIndexBase {
        constructor(params) {
            super(Object.assign({}, params, {
                indexId, 
                indexVersion,
                detailFieldDefs,
                searchFields,
                sortFields,
                kbaseTypeModule,
                kbaseTypeId,
                label
            }));
        }

        objectToData() {
            return {
                name: this.object.data.name,
                dnaSize: this.object.data.dna_size,
                gcContent: this.object.data.gc_content,
                externalSourceId: this.object.data.external_source_id,
                contigCount: this.object.data.contigs
            };
        }
    }
 
    return AssemblyIndex1;
});