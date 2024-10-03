const axios = require('axios');

// Function Definitions

// Create a new collection
async function createCollection(coreName) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/admin/cores?action=CREATE`, {
            params: {
                name: coreName,
                instanceDir: coreName,  // Directory where the core files will be stored
                configSet: '_default'   // Using the default config set
            }
        });
        console.log(`Core created: ${coreName}`, response.data);
    } catch (error) {
        console.error(`Error creating core ${coreName}:`, error.response ? error.response.data : error.message);
    }
}



// Index employee data into the collection, excluding a specified column
async function indexData(p_collection_name, p_exclude_column) {
    const employees = [
        { id: "1", name: "Danand", department: "IT", gender: "Male" },
        { id: "2", name: "Soalwin", department: "HR", gender: "Male" },
        { id: "3", name: "Varun", department: "IT", gender: "Male" },
        { id: "4", name: "Aflah", department: "Finance", gender: "Male" },
        { id: "5", name: "Arshal", department: "IT", gender: "Male" },
    ];

    const docsToIndex = employees.map(emp => {
        const indexedEmployee = { ...emp };
        // Exclude specified column
        if (p_exclude_column === "Department") {
            delete indexedEmployee.department;
        }
        if (p_exclude_column === "Gender") {
            delete indexedEmployee.gender;
        }
        return indexedEmployee;
    });

    // Log indexed documents
    console.log("Documents to be indexed:", JSON.stringify(docsToIndex, null, 2));

    try {
        await axios.post(`http://localhost:8983/solr/${p_collection_name}/update?commit=true`, docsToIndex);
        console.log(`Data indexed into collection: ${p_collection_name} (excluding ${p_exclude_column})`);
    } catch (error) {
        console.error(`Error indexing data into ${p_collection_name}:`, error);
    }
}


// Search for records by column and value
async function searchByColumn(collectionName, columnName, columnValue) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/${collectionName}/select`, {
            params: {
                q: `${columnName}:${columnValue}`,
                wt: 'json'
            }
        });
        console.log(`Search results in ${collectionName}:`, response.data.response.docs);
    } catch (error) {
        console.error(`Error searching in ${collectionName}:`, error);
    }
}

// Get the count of employees in a collection
async function getEmpCount(collectionName) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/${collectionName}/select`, {
            params: {
                q: '*:*',
                rows: 0,  // No rows returned, only the count
                wt: 'json'
            }
        });
        const count = response.data.response.numFound;
        console.log(`Employee count in ${collectionName}: ${count}`);
    } catch (error) {
        console.error(`Error getting employee count for ${collectionName}:`, error);
    }
}

// Delete an employee by ID
async function delEmpById(collectionName, employeeId) {
    try {
        await axios.post(`http://localhost:8983/solr/${collectionName}/update?commit=true`, `<delete><id>${employeeId}</id></delete>`, {
            headers: { 'Content-Type': 'application/xml' }
        });
        console.log(`Deleted employee with ID: ${employeeId} from ${collectionName}`);
    } catch (error) {
        console.error(`Error deleting employee with ID ${employeeId} from ${collectionName}:`, error);
    }
}

// Get the count of employees grouped by department
async function getDepFacet(collectionName) {
    try {
        const response = await axios.get(`http://localhost:8983/solr/${collectionName}/select`, {
            params: {
                q: '*:*',
                facet: true,
                'facet.field': 'department',
                wt: 'json'
            }
        });
        console.log(`Department facet counts in ${collectionName}:`, response.data.facet_counts.facet_fields.department);
    } catch (error) {
        console.error(`Error getting department facet for ${collectionName}:`, error);
    }
}

// Main function to execute the tasks
async function main() {
    const v_nameCollection = "danand";      // Replace with your name
    const v_phoneCollection = "270703";         // Replace with your phone's last four digits

    // Function executions
    await createCollection(v_nameCollection);
    await createCollection(v_phoneCollection);
    
    await getEmpCount(v_nameCollection);
    await indexData(v_nameCollection, "Department");
    await indexData(v_phoneCollection, "Gender");
    
    await delEmpById(v_nameCollection, "3");
    
    await getEmpCount(v_nameCollection);
    
    await searchByColumn(v_nameCollection, "department", "IT");
    await searchByColumn(v_nameCollection, "gender", "Male");
    await searchByColumn(v_phoneCollection, "department", "IT");
    
    await getDepFacet(v_nameCollection);
    await getDepFacet(v_phoneCollection);
}

// Run the main function
main().catch(console.error);
