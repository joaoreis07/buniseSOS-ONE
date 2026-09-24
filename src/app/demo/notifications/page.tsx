import { DEMO_NOTIFICATIONS } from "@/modules/marketing/demo-data";
import { ModulePageHeader, PageContainer } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";

export default function DemoNotificationsPage() {
  return (
    <PageContainer>
      <ModulePageHeader
        title="Notificações"
        subtitle="Alertas e avisos do sistema · dados fictícios"
      />
      <ul className="space-y-2">
        {DEMO_NOTIFICATIONS.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.detail}</p>
            </div>
            <Badge variant="outline">Não lida</Badge>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
