import { Request, Response } from "express";
import { FireIncidentService } from "../services/fireIncident.service";
import { FireTeamService } from "../services/fireTeam.service";
import { AuthRequest } from "../types/auth";

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await FireIncidentService.createIncident({
      ...req.body,
      reporterUserId: req.user?.id,
    });

    const io = (req.app as any).get("io");
    if (io) {
      io.to("fire-service").emit("fireEmergency", { incident });
    }

    res.status(201).json({ success: true, data: incident });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const result = await FireIncidentService.getAllIncidents(req.query);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getIncidentById = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await FireIncidentService.getIncidentById(req.params.id);
    res.json({ success: true, data: incident });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await FireIncidentService.updateIncidentStatus(
      req.params.id,
      req.body.status
    );
    res.json({ success: true, data: incident });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, message: "Assignment feature coming soon" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deployEquipment = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      message: "Equipment deployment feature coming soon",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFireStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await FireIncidentService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await FireTeamService.getAllTeamMembers();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAvailableTeamMembers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const members = await FireTeamService.getAvailableMembers();
    res.json({ success: true, data: members });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeamMemberById = async (req: AuthRequest, res: Response) => {
  try {
    const member = await FireTeamService.getTeamMemberById(req.params.id);
    res.json({ success: true, data: member });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeamMemberStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const member = await FireTeamService.updateMemberStatus(
      req.params.id,
      req.body.status
    );
    res.json({ success: true, data: member });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeamStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await FireTeamService.getTeamStatistics();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
