import ObjectModel from "../models/object.model.js";
import { Conflict, NotFound } from "../utils/Errors.js";
import { uploadToS3 } from "./uploader.service.js";
import { deleteImageFromS3 } from "./uploader.service.js";

const ownerInfoValues =
  "+ownerInfo.ownerName +ownerInfo.ownerPhone +ownerInfo.description +ownerInfo.apartmentNumber +ownerInfo.entranceNumber +ownerInfo.intercomNumber +documents";

export class ObjectsService {
  static async createObject(object, images) {
    const uploadingImages = images.map(async (img) => {
      let imageUrl = "";
      let thumbnailUrl = "";
      try {
        imageUrl = await uploadToS3(img, "objects", 1920);
        thumbnailUrl = await uploadToS3(img, "objects", 560);
      } catch (err) {
        console.log("Upload Error", err);
        throw new Error("upload_image_error");
      }
      return { imageUrl, thumbnailUrl };
    });
    const uploadedImages = await Promise.all(uploadingImages);
    const fullObject = { ...object, images: uploadedImages };
    if (object.geoPosition) {
      const geo = JSON.parse(object.geoPosition);
      fullObject.geoPosition = geo;
    }

    if (object.ownerInfo) {
      const owner = JSON.parse(object.ownerInfo);
      fullObject.ownerInfo = owner;
    }

    if (object.apartmentComplex) {
      const apartmentComplex = JSON.parse(object.apartmentComplex);
      fullObject.apartmentComplex = apartmentComplex;
    }
    const newObject = new ObjectModel(fullObject);
    const result = await newObject.save();
    return result;
  }

  static async createObjectFromSellOrder(sellOrder) {
    // Преобразуем Mongoose-документ в чистый объект
    const fullObject = sellOrder.toObject();

    // Убираем ненужные системные поля
    delete fullObject._id;
    delete fullObject.__v;
    delete fullObject.createdAt;
    delete fullObject.updatedAt;

    // Создаём новый объект недвижимости
    const newObject = new ObjectModel(fullObject);
    return await newObject.save();
  }

  static async updateObject(object, images, id) {
    const originalObject = await ObjectModel.findById(id);
    if (!originalObject) {
      throw new Conflict("object_is_not_exist");
    }
    const fullObject = { ...object, images: originalObject.images };
    if (object.geoPosition) {
      const geo = JSON.parse(object.geoPosition);
      fullObject.geoPosition = geo;
    }

    if (object.ownerInfo) {
      const owner = JSON.parse(object.ownerInfo);
      fullObject.ownerInfo = owner;
    }

    if (object.apartmentComplex) {
      const apartmentComplex = JSON.parse(object.apartmentComplex);
      fullObject.apartmentComplex = apartmentComplex;
    }

    if (object.existingImages) {
      const parsedImages = JSON.parse(object.existingImages);
      fullObject.images = [...parsedImages];
    }

    if (images && images.length > 0) {
      const uploadingImages = images.map(async (img) => {
        let imageUrl = "";
        let thumbnailUrl = "";
        try {
          imageUrl = await uploadToS3(img, "objects", 1920);
          thumbnailUrl = await uploadToS3(img, "objects", 560);
        } catch (err) {
          console.log("Upload Error", err);
          throw new Error("upload_image_error");
        }
        return { imageUrl, thumbnailUrl };
      });
      const uploadedImages = await Promise.all(uploadingImages);
      fullObject.images = fullObject.images.concat(uploadedImages);
    }

    const result = ObjectModel.updateOne({ _id: id }, fullObject);
    return result;
  }

  static async getAllObjects(queryParams, isAdminService) {
    const allowedParams = [
      "type",
      "category",
      "businessType",
      "estateAgent",
      "geoPosition",
      "images",
      "description",
      "discount",
      "soldPrice",
      "sourceCustomer",
      "dealOwner",
      "mortgage",
      "exchange",
      "videoLink",
      "tiktokLink",
      "isCommercial",
      "pledge",
      "documents",
      "apartmentComplex",
      "ownerInfo",
      "countFloor",
      "ceilingHeight",
      "toiletCount",
      "houseCondition",
      "houseWallMaterial",
      "houseRoofMaterial",
      "furniture",
      "ethernet",
      "parkingSeat",
      "plotSquare",
      "hasBasement",
      "hasMansard",
      "houseType",
      "electricType",
      "heatingType",
      "gasType",
      "sewerType",
      "toiletType",
      "waterType",
      "garage",
      "landSquare",
    ];

    const {
      priceStart,
      priceEnd,
      houseSquare,
      houseSquareEnd,
      kitchenSquare,
      houseBuildingYear,
      city,
      cityRegion,
      targetFloor,
      totalFloor,
      notFirstFloor,
      notLastFloor,
      roomCount,
      visibilityStatus,
      page = 1,
      limit = 200,
      searchStreet,
      ...params
    } = queryParams;
    const filter = Object.keys(params).reduce((acc, key) => {
      if (allowedParams.includes(key)) {
        acc[key] = params[key];
      }
      return acc;
    }, {});

    const skip = (page - 1) * limit;

    if (isAdminService) {
      if (visibilityStatus) {
        filter.visibilityStatus = visibilityStatus;
      } else {
        // Показываем только активные и на проверке, остальные по фильтру
        filter.visibilityStatus = { $in: ["active", "checking"] };
      }
    } else {
      if (
        visibilityStatus === "checking" ||
        visibilityStatus === "canceled" ||
        typeof visibilityStatus === "undefined"
      ) {
        filter.visibilityStatus = "active";
      } else {
        filter.visibilityStatus = visibilityStatus;
      }
    }

    if (priceStart) {
      filter.price = {
        ...filter.price,
        $gte: priceStart,
      };
    }
    if (priceEnd) {
      filter.price = {
        ...filter.price,
        $lte: priceEnd,
      };
    }
    if (roomCount) {
      const roomCounts = roomCount.split(",").map(Number);
      const hasMore = roomCounts.some((count) => count >= 7);
      filter["$or"] = [{ roomCount: { $in: roomCounts } }];
      if (hasMore) {
        filter["$or"].push({ roomCount: { $gte: 7 } });
      }
    }
    if (notFirstFloor === "true") {
      filter.notFirstFloor = true;
    }
    if (notLastFloor === "true") {
      filter.notLastFloor = true;
    }
    if (targetFloor) {
      filter.targetFloor = targetFloor;
    }
    if (totalFloor) {
      if (totalFloor > 9) {
        filter.totalFloor = {
          $gt: totalFloor,
        };
      } else {
        filter.totalFloor = totalFloor;
      }
    }
    if (houseSquare) {
      filter.houseSquare = { ...filter.houseSquare, $gte: houseSquare };
    }
    if (houseSquareEnd) {
      filter.houseSquare = { ...filter.houseSquare, $lte: houseSquareEnd };
    }
    if (kitchenSquare) {
      filter.kitchenSquare = { $gte: kitchenSquare };
    }
    if (houseBuildingYear) {
      filter.houseBuildingYear = { $gte: houseBuildingYear };
    }
    if (city) {
      filter["geoPosition.city"] = city;
    }
    if (cityRegion) {
      filter["geoPosition.cityRegion"] = cityRegion;
    }
    if (searchStreet) {
      // eslint-disable-next-line security/detect-non-literal-regexp
      const regex = new RegExp(searchStreet, "i");
      filter["geoPosition.street"] = { $regex: regex };
    }

    const objects = await ObjectModel.find(filter)
      .select(isAdminService ? ownerInfoValues : "")
      .populate("estateAgent")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return objects;
  }

  static async getObjectById(id, isAdminService) {
    try {
      const object = await ObjectModel.findById(id)
        .select(isAdminService ? ownerInfoValues : "")
        .populate("estateAgent");
      if (!object) {
        throw new NotFound("object_is_not_exist");
      }

      if (!isAdminService) {
        if (
          object.visibilityStatus !== "active" &&
          object.visibilityStatus !== "sold"
        ) {
          throw new NotFound("object_is_not_exist");
        }

        if (object.geoPosition.isInfoHidden) {
          object.geoPosition = {
            ...object.geoPosition,
            houseNumber: null,
            mapLink: null,
          };
        }
      }

      return object;
    } catch (error) {
      console.error("getObjectById catch error:", error);
      throw error;
    }
  }

  static async deleteObject(id) {
    try {
      const object = await ObjectModel.findById(id);
      if (!object) {
        throw new NotFound("object_is_not_exist");
      }

      if (object.images.length > 0) {
        const images = object.images.reduce((acc, img) => {
          const imageKey = img.imageUrl.split("/").pop();
          const thumbnailKey = img.thumbnailUrl.split("/").pop();
          return [...acc, imageKey, thumbnailKey];
        }, []);
        const deleteImages = images.map((img) => {
          return deleteImageFromS3(`objects/${img}`);
        });
        await Promise.all(deleteImages);
      }
      const deletedObject = await ObjectModel.findByIdAndDelete(id);
      return deletedObject;
    } catch (error) {
      console.error("deleteObject catch error:", error);
      throw error;
    }
  }
}
