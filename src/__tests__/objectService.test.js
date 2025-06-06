import { describe } from "vitest";
import ObjectModel from "../models/object.model";
import { ObjectsService } from "../services/objects.service";
import { uploadToS3, deleteImageFromS3 } from "../services/uploader.service";
import { clearDatabase, closeDatabase, connect } from "./helpers/db";
import User from "../models/user.model";

// Mock S3 upload
vi.mock("../services/uploader.service", () => ({
  deleteImageFromS3: vi.fn().mockResolvedValue(true),
  uploadToS3: vi
    .fn()
    .mockImplementation((img, folder, size) =>
      size === 1920
        ? Promise.resolve(`https://s3.example.com/${folder}/full/${img.name}`)
        : Promise.resolve(`https://s3.example.com/${folder}/thumb/${img.name}`)
    ),
}));

describe("ObjectService", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  describe("Create Object", () => {
    it("should create object with images and parsed JSON fields", async () => {
      // Mock data
      const objectData = {
        type: "sell",
        category: "apartment",
        price: 100000,
        geoPosition: JSON.stringify({
          city: "Test City",
          street: "Test Street",
          houseNumber: "123",
          isInfoHidden: false,
        }),
        ownerInfo: JSON.stringify({
          ownerName: "John Doe",
          ownerPhone: "+1234567890",
          apartmentNumber: "42",
        }),
        apartmentComplex: JSON.stringify({
          title: "Test Complex",
        }),
        roomCount: 3,
        houseSquare: 80,
        visibilityStatus: "checking",
      };

      const images = [
        { name: "image1.jpg", buffer: Buffer.from("test") },
        { name: "image2.jpg", buffer: Buffer.from("test") },
      ];
      const result = await ObjectsService.createObject(objectData, images);

      // Verify result
      expect(result).toBeTruthy();
      expect(result.type).toBe("sell");
      expect(result.category).toBe("apartment");
      expect(result.price).toBe(100000);

      // Verify JSON fields were parsed correctly
      expect(result.geoPosition).toEqual({
        city: "Test City",
        street: "Test Street",
        houseNumber: "123",
        isInfoHidden: false,
      });

      expect(result.ownerInfo).toEqual({
        ownerName: "John Doe",
        ownerPhone: "+1234567890",
        apartmentNumber: "42",
      });

      expect(result.apartmentComplex).toEqual({
        title: "Test Complex",
      });

      // Verify images
      expect(result.images).toHaveLength(2);
      expect(result.images[0].imageUrl).toBe(
        "https://s3.example.com/objects/full/image1.jpg"
      );
      expect(result.images[0].thumbnailUrl).toBe(
        "https://s3.example.com/objects/thumb/image1.jpg"
      );

      // Verify S3 uploads were called
      expect(uploadToS3).toHaveBeenCalledTimes(4); // 2 images * 2 sizes

      // Verify object was saved to database
      const savedObject = await ObjectModel.findById(result._id);
      expect(savedObject).toBeTruthy();
      expect(savedObject.type).toBe("sell");
      expect(savedObject.images).toHaveLength(2);
    });

    it("should create object without optional fields", async () => {
      const objectData = {
        type: "sell",
        category: "apartment",
        price: 100000,
      };

      const result = await ObjectsService.createObject(objectData, []);

      expect(result.type).toBe("sell");
      expect(result.category).toBe("apartment");
      expect(result.price).toBe(100000);
      expect(result.images).toHaveLength(0);

      // Verify in database
      const savedObject = await ObjectModel.findById(result._id);
      expect(savedObject).toBeTruthy();
    });

    it("should handle empty images array", async () => {
      const objectData = {
        type: "sell",
        category: "apartment",
        price: 100000,
      };

      const result = await ObjectsService.createObject(objectData, []);

      expect(result.images).toHaveLength(0);
      expect(uploadToS3).not.toHaveBeenCalled();
    });

    it("should create commercial object", async () => {
      const objectData = {
        type: "rent",
        category: "commercial",
        price: 500000,
        businessType: "office",
        isCommercial: true,
        geoPosition: JSON.stringify({
          city: "Business City",
          street: "Business Street",
        }),
      };

      const result = await ObjectsService.createObject(objectData, []);

      expect(result.type).toBe("rent");
      expect(result.category).toBe("commercial");
      expect(result.businessType).toBe("office");
      expect(result.isCommercial).toBe(true);

      // Verify in database
      const savedObject = await ObjectModel.findById(result._id);
      expect(savedObject.businessType).toBe("office");
      expect(savedObject.isCommercial).toBe(true);
    });
  });

  describe("Update Object", () => {
    let existingObjectId;

    beforeEach(async () => {
      // Create a test object in the database before each test
      const existingObject = new ObjectModel({
        type: "sell",
        category: "apartment",
        price: 10000000,
        images: [
          {
            imageUrl: "https://existing.com/image1.jpg",
            thumbnailUrl: "https://existing.com/thumb1.jpg",
          },
        ],
        geoPosition: {
          city: "Old City",
          street: "Old Street",
        },
        ownerInfo: {
          ownerName: "Old Owner",
          ownerPhone: "00000",
        },
      });

      const savedObject = await existingObject.save();
      existingObjectId = savedObject._id.toString();
    });

    it("should update object with new data keeping existing images", async () => {
      const updateData = {
        price: 15000000,
        geoPosition: JSON.stringify({
          city: "New City",
          street: "New Street",
        }),
      };

      await ObjectsService.updateObject(updateData, [], existingObjectId);

      // Verify the update in database
      const updatedObject = await ObjectModel.findById(existingObjectId);
      expect(updatedObject).toBeTruthy();
      expect(updatedObject.price).toBe(15000000);
      expect(updatedObject.geoPosition.city).toBe("New City");
      expect(updatedObject.geoPosition.street).toBe("New Street");
      expect(updatedObject.images).toHaveLength(1);
      expect(updatedObject.images[0].imageUrl).toBe(
        "https://existing.com/image1.jpg"
      );
    });

    it("should update object with new images while keeping existing ones", async () => {
      const newImages = [
        { name: "new-image1.jpg", buffer: Buffer.from("test") },
        { name: "new-image2.jpg", buffer: Buffer.from("test") },
      ];

      await ObjectsService.updateObject({}, newImages, existingObjectId);

      // Verify the update in database
      const updatedObject = await ObjectModel.findById(existingObjectId);
      expect(updatedObject.images).toHaveLength(3); // 1 existing + 2 new
      expect(updatedObject.images[0].imageUrl).toBe(
        "https://existing.com/image1.jpg"
      );
      expect(updatedObject.images[1].imageUrl).toBe(
        "https://s3.example.com/objects/full/new-image1.jpg"
      );
      expect(updatedObject.images[2].imageUrl).toBe(
        "https://s3.example.com/objects/full/new-image2.jpg"
      );
    });

    it("should handle public JSON fields update", async () => {
      const updateData = {
        geoPosition: JSON.stringify({
          city: "New City",
          street: "New Street",
        }),
        apartmentComplex: JSON.stringify({
          title: "New Complex",
        }),
      };

      await ObjectsService.updateObject(updateData, [], existingObjectId);

      const updatedObject = await ObjectModel.findById(existingObjectId);
      expect(updatedObject.geoPosition.city).toBe("New City");
      expect(updatedObject.apartmentComplex.title).toBe("New Complex");
    });
  });

  describe("Get Objects", () => {
    let testObjects;
    let testAgent;

    beforeEach(async () => {
      testAgent = await User.create({
        name: "Test Agent",
        username: "testagent",
        phone: "+77071112233",
        role: "Member",
        password: "1234",
      });

      // Create test objects with estateAgent reference
      testObjects = await ObjectModel.create([
        {
          type: "sell",
          category: "apartment",
          price: 100000,
          roomCount: 3,
          houseSquare: 80,
          kitchenSquare: 12,
          visibilityStatus: "active",
          estateAgent: testAgent._id, // Reference to the agent
          geoPosition: {
            city: "Almaty",
            cityRegion: "Center",
            street: "Abaya",
            houseNumber: "123",
            mapLink: "https://maps.example.com/123",
            isInfoHidden: false,
          },
          houseBuildingYear: 2020,
          targetFloor: 5,
          totalFloor: 9,
          notFirstFloor: true,
          notLastFloor: true,
          createdAt: new Date("2024-01-01"),
          ownerInfo: {
            ownerName: "John Doe",
            ownerPhone: "+7777777777",
          },
        },
        {
          type: "rent",
          category: "house",
          price: 150000,
          roomCount: 4,
          houseSquare: 120,
          kitchenSquare: 15,
          visibilityStatus: "checking",
          estateAgent: testAgent._id,
          geoPosition: {
            city: "Almaty",
            cityRegion: "North",
            street: "Dostyk",
          },
          houseBuildingYear: 2018,
          createdAt: new Date("2024-01-02"),
        },
        {
          type: "sell",
          category: "apartment",
          price: 200000,
          roomCount: 7,
          houseSquare: 150,
          kitchenSquare: 20,
          visibilityStatus: "active",
          estateAgent: testAgent._id,
          geoPosition: {
            city: "Astana",
            cityRegion: "Left Bank",
            street: "Turan",
          },
          houseBuildingYear: 2022,
          createdAt: new Date("2024-01-03"),
        },
      ]);
    });

    it("should return active objects for non-admin service", async () => {
      const result = await ObjectsService.getAllObjects({}, false);

      expect(result).toHaveLength(2);
      expect(result.every((obj) => obj.visibilityStatus === "active")).toBe(
        true
      );
    });

    it("should filter by estate agent", async () => {
      const agent = await User.findOne({ username: "testagent" });
      const result = await ObjectsService.getAllObjects(
        {
          estateAgent: agent._id,
        },
        true
      );

      expect(result).toHaveLength(3);
      expect(
        result.every(
          (obj) => obj.estateAgent._id.toString() === agent._id.toString()
        )
      ).toBe(true);
    });

    it("should return active and checking objects for admin service", async () => {
      const result = await ObjectsService.getAllObjects({}, true);
      expect(result).toHaveLength(3);
      expect(result.some((obj) => obj.visibilityStatus === "checking")).toBe(
        true
      );
    });

    // Room count tests
    it("should filter by exact room count", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          roomCount: "3",
        },
        true
      );

      expect(result).toHaveLength(1);
      expect(result[0].roomCount).toBe(3);
    });

    it("should filter by multiple room counts", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          roomCount: "3,4",
        },
        true
      );

      expect(result).toHaveLength(2);
      expect(result.every((obj) => [3, 4].includes(obj.roomCount))).toBe(true);
    });

    it("should handle 7+ rooms filter", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          roomCount: "7",
        },
        true
      );

      expect(result).toHaveLength(1);
      expect(result[0].roomCount).toBeGreaterThanOrEqual(7);
    });

    it("should filter by city", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          city: "Almaty",
        },
        true
      );

      expect(result).toHaveLength(2);
      expect(result.every((obj) => obj.geoPosition.city === "Almaty")).toBe(
        true
      );
    });

    it("should search by street name case-insensitive", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          searchStreet: "ABA",
        },
        true
      );

      expect(result).toHaveLength(1);
      expect(result[0].geoPosition.street).toBe("Abaya");
    });

    it("should ignore non-allowed params", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          invalidParam: "value",
          type: "sell",
        },
        true
      );

      expect(result.some((obj) => obj.type === "sell")).toBe(true);
      expect(result.some((obj) => "invalidParam" in obj)).toBe(false);
    });

    it("should handle multiple filters together", async () => {
      const result = await ObjectsService.getAllObjects(
        {
          type: "sell",
          category: "apartment",
          city: "Almaty",
          priceStart: 50000,
          priceEnd: 120000,
          houseSquare: 70,
        },
        true
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("sell");
      expect(result[0].category).toBe("apartment");
      expect(result[0].geoPosition.city).toBe("Almaty");
      expect(result[0].price).toBe(100000);
      expect(result[0].houseSquare).toBe(80);
    });

    it("should return full object with owner info for admin service", async () => {
      const result = await ObjectsService.getObjectById(
        testObjects[0]._id,
        true
      );

      expect(result.visibilityStatus).toBe("active");
      expect(result.estateAgent._id.toString()).toBe(testAgent._id.toString());
      expect(result.estateAgent.name).toBe("Test Agent");
      expect(result.geoPosition.houseNumber).toBe("123");
      expect(result.geoPosition.mapLink).toBe("https://maps.example.com/123");
      expect(result.ownerInfo).toBeDefined();
      expect(result.ownerInfo.ownerName).toBe("John Doe");
    });

    it("should hide sensitive info for non-admin service when isInfoHidden is true", async () => {
      const result = await ObjectsService.getObjectById(
        testObjects[2]._id,
        false
      );

      expect(result.visibilityStatus).toBe("active");
      expect(result.geoPosition.city).toBe("Astana");
      expect(result.geoPosition.street).toBe("Turan");
      // These should be undefined because isInfoHidden is true
      expect(result.geoPosition.houseNumber).toBeUndefined();
      expect(result.geoPosition.mapLink).toBeUndefined();
      expect(result.ownerInfo).toEqual({
        apartmentNumber: undefined,
        description: undefined,
        entranceNumber: undefined,
        intercomNumber: undefined,
        ownerName: undefined,
        ownerPhone: undefined,
      });
    });
  });

  describe("deleteObject", () => {
    it("should handle multiple images deletion", async () => {
      const testAgent = await User.create({
        name: "Test Agent",
        username: "testagent",
        phone: "+77071112233",
        role: "Member",
        password: "1234",
      });
      // Create object with multiple images
      const objectWithMultipleImages = await ObjectModel.create({
        type: "sell",
        category: "apartment",
        price: 100000,
        visibilityStatus: "active",
        estateAgent: testAgent._id,
        images: [
          {
            imageUrl: "https://bucket.s3.amazon.com/objects/image1.jpg",
            thumbnailUrl:
              "https://bucket.s3.amazon.com/objects/thumb_image1.jpg",
          },
          {
            imageUrl: "https://bucket.s3.amazon.com/objects/image2.jpg",
            thumbnailUrl:
              "https://bucket.s3.amazon.com/objects/thumb_image2.jpg",
          },
        ],
      });

      await ObjectsService.deleteObject(objectWithMultipleImages._id);

      // Verify all images were queued for deletion
      expect(deleteImageFromS3).toHaveBeenCalledTimes(4); // 2 images + 2 thumbnails
      expect(deleteImageFromS3).toHaveBeenCalledWith("objects/image1.jpg");
      expect(deleteImageFromS3).toHaveBeenCalledWith(
        "objects/thumb_image1.jpg"
      );
      expect(deleteImageFromS3).toHaveBeenCalledWith("objects/image2.jpg");
      expect(deleteImageFromS3).toHaveBeenCalledWith(
        "objects/thumb_image2.jpg"
      );
    });
  });
});
