"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateGeoData = exports.searchGeoLocations = exports.getUpazilas = exports.getDistricts = exports.getDivisions = void 0;
const bdGeo_service_1 = require("../services/bdGeo.service");
/**
 * Get all divisions
 * GET /api/bd-geo/divisions
 */
const getDivisions = async (req, res) => {
    try {
        const divisions = await (0, bdGeo_service_1.getAllDivisions)();
        const response = {
            success: true,
            message: "Divisions retrieved successfully",
            data: divisions,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Get divisions error:", error);
        const errorResponse = {
            success: false,
            message: "Failed to retrieve divisions",
            statusCode: 500,
        };
        res.status(500).json(errorResponse);
    }
};
exports.getDivisions = getDivisions;
/**
 * Get districts by division ID or all districts
 * GET /api/bd-geo/districts
 * GET /api/bd-geo/districts?divisionId=6
 */
const getDistricts = async (req, res) => {
    try {
        const { divisionId } = req.query;
        const districts = divisionId
            ? await (0, bdGeo_service_1.getDistrictsByDivision)(divisionId)
            : await (0, bdGeo_service_1.getAllDistricts)();
        const response = {
            success: true,
            message: "Districts retrieved successfully",
            data: districts,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Get districts error:", error);
        const errorResponse = {
            success: false,
            message: "Failed to retrieve districts",
            statusCode: 500,
        };
        res.status(500).json(errorResponse);
    }
};
exports.getDistricts = getDistricts;
/**
 * Get upazilas by district ID or all upazilas
 * GET /api/bd-geo/upazilas
 * GET /api/bd-geo/upazilas?districtId=47
 */
const getUpazilas = async (req, res) => {
    try {
        const { districtId } = req.query;
        const upazilas = districtId
            ? await (0, bdGeo_service_1.getUpazilasByDistrict)(districtId)
            : await (0, bdGeo_service_1.getAllUpazilas)();
        const response = {
            success: true,
            message: "Upazilas retrieved successfully",
            data: upazilas,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Get upazilas error:", error);
        const errorResponse = {
            success: false,
            message: "Failed to retrieve upazilas",
            statusCode: 500,
        };
        res.status(500).json(errorResponse);
    }
};
exports.getUpazilas = getUpazilas;
/**
 * Search locations (divisions, districts, upazilas)
 * GET /api/bd-geo/search?q=dhaka
 */
const searchGeoLocations = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== "string") {
            const errorResponse = {
                success: false,
                message: "Search query is required",
                statusCode: 400,
            };
            res.status(400).json(errorResponse);
            return;
        }
        const results = await (0, bdGeo_service_1.searchLocations)(q);
        const response = {
            success: true,
            message: "Search results retrieved successfully",
            data: results,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Search locations error:", error);
        const errorResponse = {
            success: false,
            message: "Failed to search locations",
            statusCode: 500,
        };
        res.status(500).json(errorResponse);
    }
};
exports.searchGeoLocations = searchGeoLocations;
/**
 * Populate BD geographical data (Admin only)
 * POST /api/bd-geo/populate
 */
const populateGeoData = async (req, res) => {
    try {
        // This should be protected by admin middleware
        await (0, bdGeo_service_1.populateAllBDGeoData)();
        const response = {
            success: true,
            message: "BD geographical data populated successfully",
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Populate geo data error:", error);
        const errorResponse = {
            success: false,
            message: "Failed to populate geographical data",
            statusCode: 500,
        };
        res.status(500).json(errorResponse);
    }
};
exports.populateGeoData = populateGeoData;
