export async function reverseGeocode(
  latitude,
  longitude
) {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=json` +
    `&lat=${latitude}` +
    `&lon=${longitude}` +
    `&zoom=18` +
    `&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      "Unable to find address for this location."
    );
  }

  const data = await response.json();

  return {
    displayAddress:
      data.display_name || "",

    house_no:
      data.address?.house_number || "",

    street:
      data.address?.road ||
      data.address?.street ||
      "",

    area:
      data.address?.suburb ||
      data.address?.neighbourhood ||
      data.address?.village ||
      "",

    city:
      data.address?.city ||
      data.address?.town ||
      data.address?.municipality ||
      "",

    state:
      data.address?.state || "",

    pincode:
      data.address?.postcode || "",

    latitude,
    longitude,
  };
}