import { combineDateTime, FormValues } from "@/components/search/form.tsx";
import { getApplicableDiscountTypes } from "@/lib/pricing";
import { API } from "@/server/api";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { VehicleListItem } from "./VehicleListItem";

function DiscountBanner({ startDateTime, endDateTime }: { startDateTime: Date; endDateTime: Date }) {
  const types = getApplicableDiscountTypes(startDateTime, endDateTime);
  if (types.length === 0) return null;

  const message =
    types.includes("holiday") && types.includes("long-rental")
      ? "Holiday & long rental discounts available — best price automatically applied per vehicle"
      : types.includes("holiday")
        ? "Your selected dates include a holiday — 17% discount automatically applied"
        : "$10/hr long rental discount applied — you're renting for more than 3 days";

  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      {message}
    </div>
  );
}

export function VehicleList() {
  const form = useFormContext<FormValues>();
  const startDate = form.watch("startDate");
  const startTime = form.watch("startTime");
  const endDate = form.watch("endDate");
  const endTime = form.watch("endTime");
  const minPassengers = form.watch("minPassengers");
  const classifications = form.watch("classification");
  const makes = form.watch("make");
  const price = form.watch("price");

  const startDateTime = useMemo(
    () => combineDateTime(startDate, startTime),
    [startDate, startTime],
  );
  const endDateTime = useMemo(
    () => combineDateTime(endDate, endTime),
    [endDate, endTime],
  );

  const searchResponse = API.searchVehicles({
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    passengerCount: Number(minPassengers),
    classifications,
    makes,
    priceMin: price[0],
    priceMax: price[1],
  });

  if (searchResponse.vehicles.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-muted-foreground">
          No vehicles found. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div>
      <DiscountBanner startDateTime={startDateTime} endDateTime={endDateTime} />
      <ul className="space-y-4">
        {searchResponse.vehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
          />
        ))}
      </ul>
    </div>
  );
}
