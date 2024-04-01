#!/usr/bin/env node
const fs = require('fs').promises;
const axios = require('axios');
const pLimit = require('p-limit');

async function geocodeAddress(address) {
    console.log("Processing address: " + address);
    const baseURL = 'https://nominatim.openstreetmap.org/search';
    const params = {
        q: address,
        format: 'json',
        countrycodes: 'TZ'  // Limit results to Tanzania
    };

    let res = {
        address: address
    };
    try {
        const response = await axios.get(baseURL, { params });
        res = {
            ...res,
            status: response.status
        };
        if (response.status === 200) {
            const data = response.data;
            if (data && data.length > 0) {
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                res = {
                    ...res,
                    location: data,
                    latitude: latitude,
                    longitude: longitude
                };
                /* 
                .map(item => ({
                        place_id: item.place_id,
                        licence: item.licence,
                        osm_type: item.osm_type,
                        osm_id: item.osm_id,
                        boundingbox: item.boundingbox,
                        lat: item.lat,
                        lon: item.lon,
                        display_name: item.display_name,
                        category: item.category,
                        type: item.type
                    }))
                    */
            } else {
            }
        } else {
        }
    } catch (error) {
        res = { ...res, status: -1, error: error };
    }
    console.log(JSON.stringify(res, null, 2));
    return res;
}

/*
async function processAddressesFromFile(filePath, outputFilePath) {
    try {
        const addresses = await fs.readFile(filePath, 'utf-8');
        const addressesArray = addresses.split('\n').filter(Boolean); // Filter out empty lines
        const results = await Promise.all(addressesArray.map(async (address) => {
            return await geocodeAddress(address.trim());
        }));

        await fs.writeFile(outputFilePath, JSON.stringify(results, null, 2));
        console.log(`Geocoding results have been written to ${outputFilePath}`);
        console.log(`Total addresses processed: ${results.length}`);
    } catch (error) {
        console.error('Error processing addresses:', error);
    }
}
*/


async function processAddressesFromFile(filePath, outputFilePath) {
    try {
        const addresses = await fs.readFile(filePath, 'utf-8');
        const addressesArray = addresses.split('\n').filter(Boolean); // Filter out empty lines
        const results = [];
        const concurrencyLimit = 4; // Maximum number of concurrent requests
        
        // Create a concurrency limiter with the specified concurrency limit
        const limit = pLimit(concurrencyLimit);

        // Function to handle geocoding address with concurrency control
        const geocodeWithConcurrency = async (address) => {
            const result = await geocodeAddress(address.trim());
            results.push(result);
        };

        // Use p-limit to control concurrency
        await Promise.all(addressesArray.map(address => limit(() => geocodeWithConcurrency(address))));

        // Write results to output file
        await fs.writeFile(outputFilePath, JSON.stringify(results, null, 2));
        console.log(`Geocoding results have been written to ${outputFilePath}`);
        console.log(`Total addresses processed: ${results.length}`);
    } catch (error) {
        console.error('Error processing addresses:', error);
    }
}


// Fetch file paths from command-line arguments
const inputFilePath = process.argv[2];
const outputFilePath = process.argv[2] + ".json";
if (!inputFilePath) {
    console.log('Please provide both input and output file paths as command-line arguments.');
    process.exit(1);
}

// Example usage
processAddressesFromFile(inputFilePath, outputFilePath);
