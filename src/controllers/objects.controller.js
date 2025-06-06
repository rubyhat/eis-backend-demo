import { ObjectsService } from "../services/objects.service.js";
import { NotFound } from "../utils/Errors.js";

class ObjectsController {
  static async getAllObjects(req, res, next) {
    try {
      const objects = await ObjectsService.getAllObjects(
        req.query,
        req.isAdminService
      );
      return res.status(200).json({ data: objects });
    } catch (error) {
      next(error);
    }
  }

  static async getObjectById(req, res, next) {
    try {
      const id = req.params.id;
      const object = await ObjectsService.getObjectById(id, req.isAdminService);
      return res.status(200).json(object);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const object = await ObjectsService.createObject(req.body, req.files);
      return res.status(201).json({ object });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const object = await ObjectsService.updateObject(
        req.body,
        req.files,
        req.params.id
      );
      return res.status(201).json({ object });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = req.params.id;
      const deletedObject = ObjectsService.deleteObject(id);
      if (!deletedObject) {
        return res.status(404).json(new NotFound());
      }
      return res.status(200).json(deletedObject);
    } catch (error) {
      next(error);
    }
  }
}

export default ObjectsController;
