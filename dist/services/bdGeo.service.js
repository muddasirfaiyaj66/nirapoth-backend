"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLocations = exports.getAllUpazilas = exports.getUpazilasByDistrict = exports.getAllDistricts = exports.getDistrictsByDivision = exports.getAllDivisions = exports.populateAllBDGeoData = exports.populateUpazilas = exports.populateDistricts = exports.populateDivisions = exports.fetchUpazilasByDistrictFromAPI = exports.fetchDistrictsByDivisionFromAPI = exports.fetchDistrictsFromAPI = exports.fetchDivisionsFromAPI = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
const BD_API_BASE = "https://bdapi.vercel.app/api/v.1";
/**
 * Fetch all divisions from BD API
 */
const fetchDivisionsFromAPI = async () => {
    try {
        const response = await axios_1.default.get(`${BD_API_BASE}/division`);
        return response.data.data;
    }
    catch (error) {
        console.error("Error fetching divisions:", error);
        throw new Error("Failed to fetch divisions from BD API");
    }
};
exports.fetchDivisionsFromAPI = fetchDivisionsFromAPI;
/**
 * Fetch all districts from BD API
 */
const fetchDistrictsFromAPI = async () => {
    try {
        const response = await axios_1.default.get(`${BD_API_BASE}/district`);
        return response.data.data;
    }
    catch (error) {
        console.error("Error fetching districts:", error);
        throw new Error("Failed to fetch districts from BD API");
    }
};
exports.fetchDistrictsFromAPI = fetchDistrictsFromAPI;
/**
 * Fetch districts by division ID from BD API
 */
const fetchDistrictsByDivisionFromAPI = async (divisionId) => {
    try {
        const response = await axios_1.default.get(`${BD_API_BASE}/district/${divisionId}`);
        return response.data.data;
    }
    catch (error) {
        console.error(`Error fetching districts for division ${divisionId}:`, error);
        throw new Error("Failed to fetch districts from BD API");
    }
};
exports.fetchDistrictsByDivisionFromAPI = fetchDistrictsByDivisionFromAPI;
/**
 * Fetch all upazilas for a district from BD API
 */
const fetchUpazilasByDistrictFromAPI = async (districtId) => {
    try {
        const response = await axios_1.default.get(`${BD_API_BASE}/upazilla/${districtId}`);
        return response.data.data;
    }
    catch (error) {
        console.error(`Error fetching upazilas for district ${districtId}:`, error);
        throw new Error("Failed to fetch upazilas from BD API");
    }
};
exports.fetchUpazilasByDistrictFromAPI = fetchUpazilasByDistrictFromAPI;
/**
 * Populate database with all divisions
 */
const populateDivisions = async () => {
    try {
        const divisions = await (0, exports.fetchDivisionsFromAPI)();
        console.log(`📥 Fetched ${divisions.length} divisions from BD API`);
        for (const division of divisions) {
            await prisma.division.upsert({
                where: { id: division.id },
                update: {
                    name: division.name,
                    bn_name: division.bn_name,
                    url: division.url,
                },
                create: {
                    id: division.id,
                    name: division.name,
                    bn_name: division.bn_name,
                    url: division.url,
                },
            });
        }
        console.log(`✅ Successfully populated ${divisions.length} divisions`);
    }
    catch (error) {
        console.error("Error populating divisions:", error);
        throw error;
    }
};
exports.populateDivisions = populateDivisions;
/**
 * Populate database with all districts
 */
const populateDistricts = async () => {
    try {
        const districts = await (0, exports.fetchDistrictsFromAPI)();
        console.log(`📥 Fetched ${districts.length} districts from BD API`);
        for (const district of districts) {
            await prisma.district.upsert({
                where: { id: district.id },
                update: {
                    divisionId: district.division_id,
                    name: district.name,
                    bn_name: district.bn_name,
                    lat: district.lat,
                    lon: district.lon,
                    url: district.url,
                },
                create: {
                    id: district.id,
                    divisionId: district.division_id,
                    name: district.name,
                    bn_name: district.bn_name,
                    lat: district.lat,
                    lon: district.lon,
                    url: district.url,
                },
            });
        }
        console.log(`✅ Successfully populated ${districts.length} districts`);
    }
    catch (error) {
        console.error("Error populating districts:", error);
        throw error;
    }
};
exports.populateDistricts = populateDistricts;
/**
 * Populate database with all upazilas
 */
const populateUpazilas = async () => {
    try {
        // First get all districts to know which upazilas to fetch
        const districts = await prisma.district.findMany({
            select: { id: true, name: true },
        });
        console.log(`📥 Fetching upazilas for ${districts.length} districts...`);
        let totalUpazilas = 0;
        for (const district of districts) {
            try {
                const upazilas = await (0, exports.fetchUpazilasByDistrictFromAPI)(district.id);
                for (const upazila of upazilas) {
                    await prisma.upazila.upsert({
                        where: { id: upazila.id },
                        update: {
                            districtId: upazila.district_id,
                            name: upazila.name,
                            bn_name: upazila.bn_name,
                            url: upazila.url,
                        },
                        create: {
                            id: upazila.id,
                            districtId: upazila.district_id,
                            name: upazila.name,
                            bn_name: upazila.bn_name,
                            url: upazila.url,
                        },
                    });
                }
                totalUpazilas += upazilas.length;
                console.log(`  ✓ ${district.name}: ${upazilas.length} upazilas`);
            }
            catch (error) {
                console.error(`  ✗ Failed to fetch upazilas for ${district.name}`);
            }
        }
        console.log(`✅ Successfully populated ${totalUpazilas} upazilas`);
    }
    catch (error) {
        console.error("Error populating upazilas:", error);
        throw error;
    }
};
exports.populateUpazilas = populateUpazilas;
/**
 * Populate all BD geographical data
 */
const populateAllBDGeoData = async () => {
    console.log("🚀 Starting BD Geographical Data Population...\n");
    try {
        // Step 1: Populate divisions
        console.log("Step 1: Populating Divisions...");
        await (0, exports.populateDivisions)();
        console.log();
        // Step 2: Populate districts
        console.log("Step 2: Populating Districts...");
        await (0, exports.populateDistricts)();
        console.log();
        // Step 3: Populate upazilas
        console.log("Step 3: Populating Upazilas...");
        await (0, exports.populateUpazilas)();
        console.log();
        console.log("🎉 BD Geographical Data Population Complete!");
    }
    catch (error) {
        console.error("❌ Error during BD Geographical Data Population:", error);
        throw error;
    }
};
exports.populateAllBDGeoData = populateAllBDGeoData;
/**
 * Get all divisions from database
 */
const getAllDivisions = async () => {
    return await prisma.division.findMany({
        orderBy: { name: "asc" },
    });
};
exports.getAllDivisions = getAllDivisions;
/**
 * Get districts by division ID from database
 */
const getDistrictsByDivision = async (divisionId) => {
    return await prisma.district.findMany({
        where: { divisionId },
        orderBy: { name: "asc" },
    });
};
exports.getDistrictsByDivision = getDistrictsByDivision;
/**
 * Get all districts from database
 */
const getAllDistricts = async () => {
    return await prisma.district.findMany({
        include: { division: true },
        orderBy: { name: "asc" },
    });
};
exports.getAllDistricts = getAllDistricts;
/**
 * Get upazilas by district ID from database
 */
const getUpazilasByDistrict = async (districtId) => {
    return await prisma.upazila.findMany({
        where: { districtId },
        orderBy: { name: "asc" },
    });
};
exports.getUpazilasByDistrict = getUpazilasByDistrict;
/**
 * Get all upazilas from database
 */
const getAllUpazilas = async () => {
    return await prisma.upazila.findMany({
        include: { district: { include: { division: true } } },
        orderBy: { name: "asc" },
    });
};
exports.getAllUpazilas = getAllUpazilas;
/**
 * Search locations by query
 */
const searchLocations = async (query) => {
    const lowerQuery = query.toLowerCase();
    const [divisions, districts, upazilas] = await Promise.all([
        prisma.division.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { bn_name: { contains: query } },
                ],
            },
            take: 5,
        }),
        prisma.district.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { bn_name: { contains: query } },
                ],
            },
            include: { division: true },
            take: 10,
        }),
        prisma.upazila.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { bn_name: { contains: query } },
                ],
            },
            include: { district: { include: { division: true } } },
            take: 10,
        }),
    ]);
    return {
        divisions,
        districts,
        upazilas,
    };
};
exports.searchLocations = searchLocations;
