"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceById = exports.updateServiceById = exports.createService = exports.getServiceById = exports.getAllService = void 0;
const service_model_1 = require("../models/service.model");
//To get all the Bookings
const getAllService = async (req, res) => {
    try {
        const Service = await service_model_1.ServiceModel.find().populate("user space");
        res.status(200).json(Service);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getAllService = getAllService;
const getServiceById = async (req, res) => {
    const userId = req.params.id;
    try {
        const Service = await service_model_1.ServiceModel.find({ user: userId }).populate("user space");
        if (!Service) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json(Service);
    }
    catch (error) {
        res.status(500).json({ message: "Error in Servicebyid", error });
    }
};
exports.getServiceById = getServiceById;
const createService = async (req, res) => {
    const { name, description, rate, Date: createdAt } = req.body;
    try {
        //check if the user is an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const newService = new service_model_1.ServiceModel({
            name,
            description,
            rate,
            createdAt,
        });
        const createService = await newService.save();
        res.status(201).json(createService);
    }
    catch (error) {
        res.status(500).json({ message: "Error in create Service", error });
    }
};
exports.createService = createService;
const updateServiceById = async (req, res) => {
    const ServiceId = req.params.id;
    const { name, description, rate, Date: createdAt } = req.body;
    try {
        //check if the user is an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const updateService = await service_model_1.ServiceModel.findByIdAndUpdate(ServiceId, { name, description, rate, createdAt }, { new: true });
        if (!updateService) {
            return res.status(404).json({ message: "Error in update Service" });
        }
        res.status(200).json(updateService);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Server error in update service controller", error });
    }
};
exports.updateServiceById = updateServiceById;
const deleteServiceById = async (req, res) => {
    const ServiceId = req.params.id;
    try {
        //check if the user is an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const deleteService = await service_model_1.ServiceModel.findByIdAndDelete(ServiceId);
        if (!deleteService) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json({ message: "Service deleted successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Server error in deleting Service controller", error });
    }
};
exports.deleteServiceById = deleteServiceById;
