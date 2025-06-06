export type CategoryType =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "business"
  | "factory"
  | "other"; // Категория: квартира, дом, земельный участок, коммерческая недвижимость, бизнес, завод, другое
export type ServiceType = "buy" | "rent"; // Продажа или аренда
export type HouseConditionType = "perfect" | "good" | "bad" | "free" | "build"; // Хорошее, среднее, требует ремонта, свободная планировка, черновая отделка
export type VisibilityStatusType = "active" | "sold" | "canceled" | "checking"; // Активен, Продан, Отменен, На проверке, на клиенте показываем только Активные
export type HouseType = "part" | "full" | "cottage"; // Часть дома, Целый дом, Дача
export type FurnitureType = "part" | "full" | "none"; // Мебелирован: частично, полностью, без мебели
export type ElectricType = "part" | "full" | "none"; // Электричество: частично, есть, нет
export type HeatingType = "central" | "gas" | "solid" | "liquid" | "none"; // Отопление: Центральное, на газу, на угле, на бензине, нет
export type GasType = "central" | "auto" | "canConnect" | "none"; // Газ: центральный, автономный, есть возможность подключить, нет
export type SewerType = "central" | "septik" | "canConnect" | "none"; // Канализация: центральная, септик, можно подключить, нет
export type ToiletType = "in" | "out"; // Туалет: в доме, на улице
export type WaterType = "central" | "borehole" | "canConnect" | "none"; // Вода: центральная, скважина, можно подключить, нет
export type EthernetType = "connected" | "toConnect" | "none";
export type HouseWallMaterialType =
  | "brick" // Кирпич
  | "wood" // Дерево
  | "gasSilicateBlock" // Газосиликатный блок
  | "cinderBlock" // Шлакоблок
  | "heatBlock" // Теплоблок
  | "panel" // Каркасно-щитовой
  | "monolith" // Монолит
  | "saman" // Саман
  | "gasConcreteBlock" // Газобетонный блок
  | "foamBlock"; // Пеноблок
export type HouseRoofMaterialType =
  | "tile" // Черепица
  | "soft" // Мягкая кровля
  | "metal" // Металл
  | "ondulin" // Ондулин
  | "metalTile" // Металлочерепица
  | "corrugatedSheetRoof" // Профлист
  | "slate"; // Шифер
export type PledgeType = "none" | "bank" | "police"; // Залог: нет, да у банка, да арест
export type DocumentsType = "good" | "needUpdate" | "bad"; // Залог: нет, да у банка, да арест

export interface EstateAgentInfo {
  id: string; // uuid?
  name: string;
  avatar: string;
  phone: string;
}

export interface GeoPositionInfo {
  city: string; // Город
  street: string; // Улица
  houseNumber: number; // Номер дома
  isInfoHidden: boolean; // Свитчер для сокрытия адреса
  mapLink: string; // Ссылка на 2гис
}

// Общие характеристики, вне зависимости от категории объекта
export interface ObjectItem {
  description: string; // Текстовое описание объекта недвижимости
  price: number; // or string? Стоимость
  discount: number; // or string? Размер снижения стоимость(скидки)
  images: string[]; // Пачка фотографий объекта недвижимости
  videoLink: string; // Ссылка на видео обзор
  mortgage: boolean; // Имеется ли ипотека по данному объекту
  hasSwap: boolean; // Есть обмен да/нет
  isCommercial: boolean; // Коммерческая недвижимости или нет
  pledge: PledgeType; // В залоге да или нет
  documents: DocumentsType; // Документы в порядке или нет
  type: ServiceType; // Купить или сдать в аренду
  visibilityStatus: VisibilityStatusType; // Статус видимости объекта
  category: CategoryType; // Квартира, дом, земельный участок и так далее
  estateAgent: EstateAgentInfo; // Данные об агенте недвижимости, который сопровождает этот объект, к нему будут все звонить писать и задавать вопросы
  geoPosition: GeoPositionInfo; // Данные об объекте недвижимости, где она
}

// Общие характеристики, которые могут быть в квартире/доме
export interface Apartment extends ObjectItem {
  roomCount: number; // Количество комнат
  houseBuildingYear: number; // Год постройки
  houseSquare: number; // Площадь общая
  kitchenSquare: number; // Площадь кухни
  countFloor: number; // Количество этажей в квартире/доме (бывают двухэтажные квартиры, трех этажные котеджи и т.д.)
  ceilingHeight: number; // Высота потолков
  toiletCount: number; // Количество сан.узлов
  houseCondition: HouseConditionType; // Состояние дома
  houseWallMaterial: HouseWallMaterialType; // Материал стен
  houseRoofMaterial: HouseRoofMaterialType; // Материал крыши
  furniture: FurnitureType; // Мебелирован ли?
  ethernet: EthernetType; // Интернет
}

// Только в доме
export interface House extends Apartment {
  plotSquare: number; // Площадь/количество соток земли у дома
  hasBasement: boolean; // Есть/нет цокольный этаж
  hasMansard: boolean; // Есть/нет мансарда
  houseType: HouseType; // Тип дома, бывает что в одном доме два хозяина, поделен по-полам;
  electricType: ElectricType;
  heatingType: HeatingType;
  gasType: GasType;
  sewerType: SewerType;
  toiletType: ToiletType;
  waterType: WaterType;
}
// Только в квартире
export interface Flat extends Apartment {
  targetFloor: number; // Этаж, на котором находится объект
  totalFloor: number; // Общее количество этажей в здании
}

// Только в земельном участке
export interface Land extends ObjectItem {
  landSquare: string; // Площадь земли
}

// Можно сделать такие категории, но конкретных характеристик для них не будет
export interface Commercial extends ObjectItem {}
export interface Business extends ObjectItem {}
export interface Factory extends ObjectItem {}
export interface OtherObject extends ObjectItem {}
