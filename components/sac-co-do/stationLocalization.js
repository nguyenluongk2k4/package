import stationsDict from "../../locales/stations.json";

export function localizeStation(station, locale) {
  if (!station) return station;

  const text = stationsDict[station.id]?.[locale] || stationsDict[station.id]?.vi;
  if (!text) return station;

  return {
    ...station,
    name: text.name,
    tag: text.tag,
    stamp: text.stamp,
    description: text.description,
  };
}

export function localizeStations(stationList, locale) {
  return (stationList || []).map((station) => localizeStation(station, locale));
}
