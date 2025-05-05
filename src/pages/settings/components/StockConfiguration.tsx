
import { Card, CardContent } from "@/components/ui/card";
import { StockConfigHeader } from "./stock-config/StockConfigHeader";
import { StockConfigurationContent } from "./stock-config/StockConfigurationContent";
import { useStockConfiguration } from "../hooks/useStockConfiguration";

export function StockConfiguration() {
  const {
    loading,
    saving,
    success,
    error,
    storeSettings,
    setStoreSettings,
    handleUpdateStockSettings,
    setError
  } = useStockConfiguration();

  return (
    <Card>
      <StockConfigHeader />
      <CardContent>
        <StockConfigurationContent
          loading={loading}
          saving={saving}
          success={success}
          error={error}
          storeSettings={storeSettings}
          onSettingsChange={setStoreSettings}
          onSave={handleUpdateStockSettings}
          onErrorDismiss={() => setError(null)}
        />
      </CardContent>
    </Card>
  );
}
