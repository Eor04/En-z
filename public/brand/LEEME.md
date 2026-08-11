# Logo de En Z

Guardá acá el archivo del logo oficial con este nombre exacto:

```
public/brand/en-z-logo.png
```

Recomendado: PNG cuadrado de 1024×1024 (o el original que tengas), con el
emblema centrado. **Puede venir con fondo negro**: la app aplica
`mix-blend-mode: screen`, así que ese negro se vuelve transparente y el aura
animada se ve por detrás. Si el logo tiene fondo transparente, también funciona.

Mientras el archivo no exista, la app dibuja automáticamente el emblema
vectorial de respaldo (`src/presentation/components/brand/EnZMark.tsx`).

Todo lo que usa el logo — splash de arranque, navbar, pie, login, marcas de
agua — pasa por `EnZLogo`, así que basta con dejar el archivo acá y recargar.
