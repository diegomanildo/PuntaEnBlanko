# Punta en Blanko

Sistema de gestión para punto de venta (POS). Aplicación de escritorio para Windows, pensada para negocios que necesitan registrar ventas, controlar stock, armar presupuestos y llevar el historial de facturación de forma simple, sin conexión a internet.

## ¿Qué podés hacer con la app?

- **Nueva venta**: registrar una venta rápido, eligiendo productos y medio de pago (efectivo, transferencia o mixto).
- **Productos**: alta, edición y control de stock. La app te avisa en la pantalla principal cuando un producto está sin stock o por debajo del límite configurado.
- **Presupuestos**: crear presupuestos para clientes, editarlos y convertirlos en venta cuando el cliente confirma (con chequeo de stock disponible en ese momento).
- **Clientes**: alta y edición de clientes, con validación de CUIT, teléfono y mail.
- **Facturación del día / del mes**: reportes de lo vendido, con gráficos y el top de productos más vendidos.
- **Copias de seguridad**: la app crea automáticamente una copia de la base de datos al abrirse (si está activado), y también permite generar copias manuales, elegir carpeta de destino y limitar cuántas copias se conservan.

## Instalación

Se instala como cualquier programa de Windows: descargá el instalador (`.exe`) y seguí los pasos. Durante la instalación podés elegir la carpeta de destino.

No requiere instalar nada más (ni Node, ni una base de datos aparte): todo viene incluido dentro de la aplicación.

## Uso diario

1. Abrí la aplicación. Si tenés el backup automático activado, se genera una copia de seguridad al iniciar.
2. Desde la pantalla principal accedés a las secciones: Nueva Venta, Productos, Presupuestos, Clientes, Facturación y Copias de seguridad.
3. Los datos quedan guardados en tu computadora — no se suben a ningún servidor externo.

## Copias de seguridad

Recomendado configurar la carpeta de destino de los backups en una ubicación que también se respalde por otro medio (por ejemplo, una carpeta sincronizada con la nube). Desde la sección **Copias de seguridad** podés:

- Ver dónde se están guardando las copias.
- Activar o desactivar el backup automático al abrir la app.
- Limitar cuántas copias viejas se conservan (para no llenar el disco).
- Generar una copia manual en cualquier momento.

## Soporte

Ante cualquier problema o duda sobre el uso de la aplicación, contactar a quien te la haya entregado o instalado.
