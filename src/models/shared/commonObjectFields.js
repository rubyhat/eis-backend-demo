import mongoose from "mongoose";
import {
  CategoryEnum,
  DocumentsEnum,
  ElectricTypeEnum,
  EthernetEnum,
  ExchangeEnum,
  FurnitureEnum,
  GarageEnum,
  GasTypeEnum,
  HeatingTypeEnum,
  HouseConditionEnum,
  HouseRoofMaterialEnum,
  HouseTypeEnum,
  HouseWallMaterialEnum,
  PledgeEnum,
  SewerTypeEnum,
  ToiletTypeEnum,
  WaterTypeEnum,
  DealTypeEnum,
} from "@estate-information-system/shared-types";

/**
 * Общие свойства для моделей Object и SellOrder.
 */
const commonObjectFields = {
  type: {
    type: String,
    enum: Object.values(DealTypeEnum),
    required: true,
  },
  ownerInfo: {
    ownerName: { type: String, select: false },
    ownerPhone: { type: String, select: false },
    apartmentNumber: { type: String, select: false },
    entranceNumber: { type: String, select: false },
    intercomNumber: { type: String, select: false },
    description: { type: String, select: false },
    ownerComment: { type: String },
  },
  estateAgent: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: "User",
  },
  category: {
    type: String,
    enum: Object.values(CategoryEnum),
    required: true,
  },
  geoPosition: {
    city: { type: String },
    cityRegion: { type: String },
    street: { type: String },
    houseNumber: { type: String },
    mapLink: { type: String },
    isInfoHidden: { type: Boolean, default: false },
  },
  images: [
    {
      imageUrl: { type: String },
      thumbnailUrl: { type: String },
    },
  ],
  description: { type: String },
  price: { type: Number, required: true },
  discount: {
    type: Number,
    default: null,
  },
  soldPrice: {
    type: Number,
    default: null,
  },
  sourceCustomer: {
    type: String,
    enum: ["roze", "krisha", "instagram", "tiktok", "other"],
  },
  dealOwner: {
    type: String,
    enum: ["agency", "owner", "other"],
  },
  mortgage: {
    type: String,
    enum: ["accepted", "declined", "possibly"],
  },
  exchange: {
    type: String,
    enum: Object.values(ExchangeEnum),
  },
  videoLink: {
    type: String,
  },
  tiktokLink: {
    type: String,
  },
  isCommercial: {
    type: Boolean,
  },
  pledge: {
    type: String,
    enum: Object.values(PledgeEnum),
  },
  documents: {
    type: String,
    enum: Object.values(DocumentsEnum),
  },
  apartmentComplex: {
    title: { type: String },
  },

  // Appartment
  roomCount: { type: Number },
  houseBuildingYear: { type: Number },
  houseSquare: { type: Number },
  kitchenSquare: { type: Number },
  countFloor: { type: Number },
  ceilingHeight: { type: Number },
  toiletCount: { type: Number },
  houseCondition: {
    type: String,
    enum: Object.values(HouseConditionEnum),
  },
  houseWallMaterial: {
    type: String,
    enum: Object.values(HouseWallMaterialEnum),
  },
  houseRoofMaterial: {
    type: String,
    enum: Object.values(HouseRoofMaterialEnum),
  },
  furniture: {
    type: String,
    enum: Object.values(FurnitureEnum),
  },
  ethernet: {
    type: String,
    enum: Object.values(EthernetEnum),
  },
  parkingSeat: { type: Number },

  // House
  plotSquare: { type: String },
  hasBasement: { type: Boolean },
  hasMansard: { type: Boolean },
  houseType: {
    type: String,
    enum: Object.values(HouseTypeEnum),
  },
  electricType: {
    type: String,
    enum: Object.values(ElectricTypeEnum),
  },
  heatingType: {
    type: String,
    enum: Object.values(HeatingTypeEnum),
  },
  gasType: {
    type: String,
    enum: Object.values(GasTypeEnum),
  },
  sewerType: {
    type: String,
    enum: Object.values(SewerTypeEnum),
  },
  toiletType: {
    type: String,
    enum: Object.values(ToiletTypeEnum),
  },
  waterType: {
    type: String,
    enum: Object.values(WaterTypeEnum),
  },
  garage: {
    type: String,
    enum: Object.values(GarageEnum),
  },
  targetFloor: { type: Number },
  totalFloor: { type: Number },
  notFirstFloor: { type: Boolean },
  notLastFloor: { type: Boolean },
  landSquare: { type: String },
};

export default commonObjectFields;
