import { useEffect, useState } from "react";
import { getDashboardMetrics } from "@/services/dashboardService";
import Loader from "@/components/ui/loader/Loader";
import Alert from "@/components/ui/alert/Alert";
import CardMetrics from "@/components/dashboard/CardMetrics";
import RoadmapMonthlyChart from "@/components/dashboard/RoadmapMonthlyChart";
import RoadmapMonthlyTarget from "@/components/dashboard/RoadmapMonthlyTarget";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await getDashboardMetrics();
      setMetrics(res.data);
    } catch (error) {
      setError("No se pudieron cargar las métricas del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Alert variant="error" message={error} />;

  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <CardMetrics totalStudents={metrics.totalStudents} totalCertificates={metrics.totalCertificates} />
          <RoadmapMonthlyChart data={metrics.roadmapsCompletedByMonth} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <RoadmapMonthlyTarget
            monthlyGoal={metrics.monthlyGoal}
            completedThisMonth={metrics.roadmapsCompletedThisMonth}
            completedToday={metrics.roadmapsCompletedToday}
            progress={metrics.monthlyProgressPercentage}
          />
        </div>
      </div>
    </>
  );
}
