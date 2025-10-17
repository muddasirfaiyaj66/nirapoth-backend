import { Request, Response } from "express";
import {
  getAllDivisions,
  getDistrictsByDivision,
  getAllDistricts,
  getUpazilasByDistrict,
  getAllUpazilas,
  searchLocations,
  populateAllBDGeoData,
} from "../services/bdGeo.service";
import { SuccessResponse, ErrorResponse } from "../types/auth";

/**
 * Get all divisions
 * GET /api/bd-geo/divisions
 */
export const getDivisions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const divisions = await getAllDivisions();

    const response: SuccessResponse = {
      success: true,
      message: "Divisions retrieved successfully",
      data: divisions,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get divisions error:", error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Failed to retrieve divisions",
      statusCode: 500,
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Get districts by division ID or all districts
 * GET /api/bd-geo/districts
 * GET /api/bd-geo/districts?divisionId=6
 */
export const getDistricts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { divisionId } = req.query;

    const districts = divisionId
      ? await getDistrictsByDivision(divisionId as string)
      : await getAllDistricts();

    const response: SuccessResponse = {
      success: true,
      message: "Districts retrieved successfully",
      data: districts,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get districts error:", error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Failed to retrieve districts",
      statusCode: 500,
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Get upazilas by district ID or all upazilas
 * GET /api/bd-geo/upazilas
 * GET /api/bd-geo/upazilas?districtId=47
 */
export const getUpazilas = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { districtId } = req.query;

    const upazilas = districtId
      ? await getUpazilasByDistrict(districtId as string)
      : await getAllUpazilas();

    const response: SuccessResponse = {
      success: true,
      message: "Upazilas retrieved successfully",
      data: upazilas,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get upazilas error:", error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Failed to retrieve upazilas",
      statusCode: 500,
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Search locations (divisions, districts, upazilas)
 * GET /api/bd-geo/search?q=dhaka
 */
export const searchGeoLocations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Search query is required",
        statusCode: 400,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const results = await searchLocations(q);

    const response: SuccessResponse = {
      success: true,
      message: "Search results retrieved successfully",
      data: results,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Search locations error:", error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Failed to search locations",
      statusCode: 500,
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Populate BD geographical data (Admin only)
 * POST /api/bd-geo/populate
 */
export const populateGeoData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // This should be protected by admin middleware
    await populateAllBDGeoData();

    const response: SuccessResponse = {
      success: true,
      message: "BD geographical data populated successfully",
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Populate geo data error:", error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Failed to populate geographical data",
      statusCode: 500,
    };
    res.status(500).json(errorResponse);
  }
};
