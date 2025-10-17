import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const BD_API_BASE = "https://bdapi.vercel.app/api/v.1";

interface DivisionData {
  id: string;
  name: string;
  bn_name: string;
  url: string;
}

interface DistrictData {
  id: string;
  division_id: string;
  name: string;
  bn_name: string;
  lat?: string;
  lon?: string;
  url: string;
}

interface UpazilaData {
  id: string;
  district_id: string;
  name: string;
  bn_name: string;
  url: string;
}

interface ApiResponse<T> {
  status: number;
  success: boolean;
  data: T[];
}

/**
 * Fetch all divisions from BD API
 */
export const fetchDivisionsFromAPI = async (): Promise<DivisionData[]> => {
  try {
    const response = await axios.get<ApiResponse<DivisionData>>(
      `${BD_API_BASE}/division`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching divisions:", error);
    throw new Error("Failed to fetch divisions from BD API");
  }
};

/**
 * Fetch all districts from BD API
 */
export const fetchDistrictsFromAPI = async (): Promise<DistrictData[]> => {
  try {
    const response = await axios.get<ApiResponse<DistrictData>>(
      `${BD_API_BASE}/district`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching districts:", error);
    throw new Error("Failed to fetch districts from BD API");
  }
};

/**
 * Fetch districts by division ID from BD API
 */
export const fetchDistrictsByDivisionFromAPI = async (
  divisionId: string
): Promise<DistrictData[]> => {
  try {
    const response = await axios.get<ApiResponse<DistrictData>>(
      `${BD_API_BASE}/district/${divisionId}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching districts for division ${divisionId}:`, error);
    throw new Error("Failed to fetch districts from BD API");
  }
};

/**
 * Fetch all upazilas for a district from BD API
 */
export const fetchUpazilasByDistrictFromAPI = async (
  districtId: string
): Promise<UpazilaData[]> => {
  try {
    const response = await axios.get<ApiResponse<UpazilaData>>(
      `${BD_API_BASE}/upazilla/${districtId}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching upazilas for district ${districtId}:`, error);
    throw new Error("Failed to fetch upazilas from BD API");
  }
};

/**
 * Populate database with all divisions
 */
export const populateDivisions = async (): Promise<void> => {
  try {
    const divisions = await fetchDivisionsFromAPI();
    
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
  } catch (error) {
    console.error("Error populating divisions:", error);
    throw error;
  }
};

/**
 * Populate database with all districts
 */
export const populateDistricts = async (): Promise<void> => {
  try {
    const districts = await fetchDistrictsFromAPI();
    
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
  } catch (error) {
    console.error("Error populating districts:", error);
    throw error;
  }
};

/**
 * Populate database with all upazilas
 */
export const populateUpazilas = async (): Promise<void> => {
  try {
    // First get all districts to know which upazilas to fetch
    const districts = await prisma.district.findMany({
      select: { id: true, name: true },
    });

    console.log(`📥 Fetching upazilas for ${districts.length} districts...`);

    let totalUpazilas = 0;

    for (const district of districts) {
      try {
        const upazilas = await fetchUpazilasByDistrictFromAPI(district.id);
        
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
      } catch (error) {
        console.error(`  ✗ Failed to fetch upazilas for ${district.name}`);
      }
    }

    console.log(`✅ Successfully populated ${totalUpazilas} upazilas`);
  } catch (error) {
    console.error("Error populating upazilas:", error);
    throw error;
  }
};

/**
 * Populate all BD geographical data
 */
export const populateAllBDGeoData = async (): Promise<void> => {
  console.log("🚀 Starting BD Geographical Data Population...\n");

  try {
    // Step 1: Populate divisions
    console.log("Step 1: Populating Divisions...");
    await populateDivisions();
    console.log();

    // Step 2: Populate districts
    console.log("Step 2: Populating Districts...");
    await populateDistricts();
    console.log();

    // Step 3: Populate upazilas
    console.log("Step 3: Populating Upazilas...");
    await populateUpazilas();
    console.log();

    console.log("🎉 BD Geographical Data Population Complete!");
  } catch (error) {
    console.error("❌ Error during BD Geographical Data Population:", error);
    throw error;
  }
};

/**
 * Get all divisions from database
 */
export const getAllDivisions = async () => {
  return await prisma.division.findMany({
    orderBy: { name: "asc" },
  });
};

/**
 * Get districts by division ID from database
 */
export const getDistrictsByDivision = async (divisionId: string) => {
  return await prisma.district.findMany({
    where: { divisionId },
    orderBy: { name: "asc" },
  });
};

/**
 * Get all districts from database
 */
export const getAllDistricts = async () => {
  return await prisma.district.findMany({
    include: { division: true },
    orderBy: { name: "asc" },
  });
};

/**
 * Get upazilas by district ID from database
 */
export const getUpazilasByDistrict = async (districtId: string) => {
  return await prisma.upazila.findMany({
    where: { districtId },
    orderBy: { name: "asc" },
  });
};

/**
 * Get all upazilas from database
 */
export const getAllUpazilas = async () => {
  return await prisma.upazila.findMany({
    include: { district: { include: { division: true } } },
    orderBy: { name: "asc" },
  });
};

/**
 * Search locations by query
 */
export const searchLocations = async (query: string) => {
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
