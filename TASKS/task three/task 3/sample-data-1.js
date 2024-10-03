const axios = require('axios');

// Helper function to chunk data for large dataset indexing
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// 1. Create Collection
async function createCollection(coreName) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/admin/cores?action=CREATE`, {
            params: {
                name: coreName,
                instanceDir: coreName,
                configSet: '_default'
            }
        });
        console.log(`Core created: ${coreName}`, response.data);
    } catch (error) {
        console.error(`Error creating core ${coreName}:`, error.response ? error.response.data : error.message);
    }
}

// 2. Index data excluding a specified column

// 2. Index data excluding a specified column
async function indexData(p_collection_name, p_exclude_column) {
    try {
        // Fetch existing data from sample-data core
        const response = await axios.get(`http://localhost:8983/solr/sample-data/select`, {
            params: {
                q: '*:*',
                wt: 'json',
                rows: 5000 // Adjust as per your sample size
            }
        });

        const docsToIndex = response.data.response.docs.map(doc => {
            const indexedDoc = { ...doc };
            // Exclude the specified column
            delete indexedDoc[p_exclude_column];
            // Remove the _version_ field to avoid version conflict
            delete indexedDoc['_version_'];
            // Remove the _root_ field if it exists
            delete indexedDoc['_root_'];
            return indexedDoc;
        });

        // Chunk the data for large indexing jobs
        const chunkSize = 100; // Indexing in chunks of 100 docs
        const chunks = chunkArray(docsToIndex, chunkSize);

        for (const chunk of chunks) {
            await axios.post(`http://localhost:8983/solr/${p_collection_name}/update?commitWithin=1000&overwrite=true`, chunk, {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log(`Indexed data to ${p_collection_name} (excluding ${p_exclude_column})`);
    } catch (error) {
        console.error(`Error indexing data into ${p_collection_name}:`, error.response ? error.response.data : error.message);
    }
}


// 3. Search by column name and value
async function searchByColumn(collectionName, columnName, columnValue) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/${collectionName}/select`, {
            params: {
                q: `${columnName}:${columnValue}`,
                wt: 'json'
            }
        });
        console.log(`Search results from ${collectionName} for ${columnName}:${columnValue}:`, response.data.response.docs);
    } catch (error) {
        console.error(`Error searching ${collectionName}:`, error.response ? error.response.data : error.message);
    }
}

// 4. Get employee count
async function getEmpCount(collectionName) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/${collectionName}/select`, {
            params: {
                q: '*:*',
                rows: 0,
                wt: 'json'
            }
        });
        const count = response.data.response.numFound;
        console.log(`Employee count in ${collectionName}: ${count}`);
    } catch (error) {
        console.error(`Error getting employee count for ${collectionName}:`, error.response ? error.response.data : error.message);
    }
}

// 5. Delete employee by ID
async function delEmpById(collectionName, employeeId) {
    try {
        const deleteQuery = `<delete><id>${employeeId}</id></delete>`;
        await axios.post(`http://localhost:8983/solr/${collectionName}/update?commit=true`, deleteQuery, {
            headers: { 'Content-Type': 'application/xml' }
        });
        console.log(`Deleted employee with ID: ${employeeId} from ${collectionName}`);
    } catch (error) {
        console.error(`Error deleting employee from ${collectionName}:`, error.response ? error.response.data : error.message);
    }
}

// 6. Get facet counts (generalized for any field)
async function getFacetCounts(collectionName, facetField) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/${collectionName}/select`, {
            params: {
                q: '*:*',
                facet: true,
                'facet.field': facetField,
                wt: 'json'
            }
        });
        console.log(`Facet counts for ${facetField} in ${collectionName}:`, response.data.facet_counts.facet_fields[facetField]);
    } catch (error) {
        console.error(`Error getting facet counts from ${collectionName}:`, error.response ? error.response.data : error.message);
    }
}

async function createCoreIfNotExists(coreName) {
    try {
        // Check if the core already exists
        const coreStatusResponse = await axios.get(`http://localhost:8983/solr/admin/cores?action=STATUS&core=${coreName}`);
        if (coreStatusResponse.data.status[coreName]) {
            console.log(`Core ${coreName} already exists.`);
        } else {
            // If the core doesn't exist, create it
            const createResponse = await axios.get(`http://localhost:8983/solr/admin/cores?action=CREATE&name=${coreName}&instanceDir=${coreName}&configSet=_default`);
            console.log(`Core created: ${coreName}`, createResponse.data);
        }
    } catch (error) {
        console.error(`Error checking or creating core ${coreName}:`, error.response ? error.response.data : error.message);
    }
}async function createCoreIfNotExists(coreName) {
    try {
        // Check if the core already exists
        const coreStatusResponse = await axios.get(`http://localhost:8983/solr/admin/cores?action=STATUS&core=${coreName}`);
        if (coreStatusResponse.data.status[coreName]) {
            console.log(`Core ${coreName} already exists.`);
        } else {
            // If the core doesn't exist, create it
            const createResponse = await axios.get(`http://localhost:8983/solr/admin/cores?action=CREATE&name=${coreName}&instanceDir=${coreName}&configSet=_default`);
            console.log(`Core created: ${coreName}`, createResponse.data);
        }
    } catch (error) {
        console.error(`Error checking or creating core ${coreName}:`, error.response ? error.response.data : error.message);
    }
}
// Main function to execute all tasks
async function main() {
    const v_nameCollection = "Danand"; // Change as per your name
    const v_phoneCollection = "2707";  // Change as per your phone's last 4 digits

    // Task execution
    await createCollection(v_nameCollection);
    await createCollection(v_phoneCollection);

    await getEmpCount(v_nameCollection);
    await indexData(v_nameCollection, "Department");
    await indexData(v_phoneCollection, "Gender");

    await delEmpById(v_nameCollection, "E02002"); // Assuming this ID exists in the indexed data
    await getEmpCount(v_nameCollection);

    await searchByColumn(v_nameCollection, 'Department', 'IT');
    await searchByColumn(v_nameCollection, 'Gender', 'Male');
    await searchByColumn(v_phoneCollection, 'Department', 'IT');

    await getFacetCounts(v_nameCollection, 'department');
    await getFacetCounts(v_phoneCollection, 'department');
}

// Execute main function
main().catch(console.error);
