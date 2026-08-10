import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCw } from 'lucide-react';

interface Device {
  name: string;
  width: number;
  height: number;
}

const DEVICES: Device[] = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 12/13 mini', width: 360, height: 780 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Galaxy A / Moto G', width: 412, height: 915 },
  { name: 'Tablet 7"', width: 600, height: 960 },
];

const PAGES = [
  { label: 'Login', path: '/login' },
  { label: 'Cadastro', path: '/register' },
  { label: 'Status Offline', path: '/offline' },
];

export default function ResponsiveTest() {
  const [landscape, setLandscape] = useState(false);
  const [path, setPath] = useState('/login');
  const [scale, setScale] = useState(0.65);

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Teste de Responsividade</h1>
          <p className="text-muted-foreground text-sm">
            Veja como a tela fica em vários tamanhos de celular, em pé e deitado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PAGES.map((p) => (
            <Button
              key={p.path}
              size="sm"
              variant={path === p.path ? 'default' : 'outline'}
              onClick={() => setPath(p.path)}
            >
              {p.label}
            </Button>
          ))}
          <Button size="sm" variant="secondary" onClick={() => setLandscape((v) => !v)}>
            <RotateCw className="mr-2 h-4 w-4" />
            {landscape ? 'Deitado' : 'Em pé'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setScale((s) => (s >= 1 ? 0.5 : +(s + 0.15).toFixed(2)))}>
            Zoom {Math.round(scale * 100)}%
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {DEVICES.map((d) => {
          const w = landscape ? d.height : d.width;
          const h = landscape ? d.width : d.height;
          return (
            <Card key={d.name} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{d.name}</CardTitle>
                <CardDescription>
                  {w} × {h} px
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-muted mx-auto overflow-hidden rounded-xl border"
                  style={{ width: w * scale, height: h * scale }}
                >
                  <iframe
                    title={`${d.name} ${path}`}
                    src={path}
                    width={w}
                    height={h}
                    style={{
                      width: w,
                      height: h,
                      border: 0,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
