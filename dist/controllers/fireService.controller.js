"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamStatistics = exports.updateTeamMemberStatus = exports.getTeamMemberById = exports.getAvailableTeamMembers = exports.getAllTeamMembers = exports.getFireStatistics = exports.deployEquipment = exports.assignTeamMembers = exports.updateIncidentStatus = exports.getIncidentById = exports.getAllIncidents = exports.createIncident = void 0;
const fireIncident_service_1 = require("../services/fireIncident.service");
const fireTeam_service_1 = require("../services/fireTeam.service");
const createIncident = async (req, res) => {
    try {
        const incident = await fireIncident_service_1.FireIncidentService.createIncident({
            ...req.body,
            reporterUserId: req.user?.id,
        });
        const io = req.app.get("io");
        if (io) {
            io.to("fire-service").emit("fireEmergency", { incident });
        }
        res.status(201).json({ success: true, data: incident });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createIncident = createIncident;
const getAllIncidents = async (req, res) => {
    try {
        const result = await fireIncident_service_1.FireIncidentService.getAllIncidents(req.query);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllIncidents = getAllIncidents;
const getIncidentById = async (req, res) => {
    try {
        const incident = await fireIncident_service_1.FireIncidentService.getIncidentById(req.params.id);
        res.json({ success: true, data: incident });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getIncidentById = getIncidentById;
const updateIncidentStatus = async (req, res) => {
    try {
        const incident = await fireIncident_service_1.FireIncidentService.updateIncidentStatus(req.params.id, req.body.status);
        res.json({ success: true, data: incident });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateIncidentStatus = updateIncidentStatus;
const assignTeamMembers = async (req, res) => {
    try {
        res.json({ success: true, message: "Assignment feature coming soon" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.assignTeamMembers = assignTeamMembers;
const deployEquipment = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Equipment deployment feature coming soon",
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deployEquipment = deployEquipment;
const getFireStatistics = async (req, res) => {
    try {
        const stats = await fireIncident_service_1.FireIncidentService.getStatistics();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFireStatistics = getFireStatistics;
const getAllTeamMembers = async (req, res) => {
    try {
        const result = await fireTeam_service_1.FireTeamService.getAllTeamMembers();
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllTeamMembers = getAllTeamMembers;
const getAvailableTeamMembers = async (req, res) => {
    try {
        const members = await fireTeam_service_1.FireTeamService.getAvailableMembers();
        res.json({ success: true, data: members });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAvailableTeamMembers = getAvailableTeamMembers;
const getTeamMemberById = async (req, res) => {
    try {
        const member = await fireTeam_service_1.FireTeamService.getTeamMemberById(req.params.id);
        res.json({ success: true, data: member });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTeamMemberById = getTeamMemberById;
const updateTeamMemberStatus = async (req, res) => {
    try {
        const member = await fireTeam_service_1.FireTeamService.updateMemberStatus(req.params.id, req.body.status);
        res.json({ success: true, data: member });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTeamMemberStatus = updateTeamMemberStatus;
const getTeamStatistics = async (req, res) => {
    try {
        const stats = await fireTeam_service_1.FireTeamService.getTeamStatistics();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTeamStatistics = getTeamStatistics;
