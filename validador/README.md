# Datos del validador

Todos los datos utilizados por la aplicación se guardan localmente en
`validador/data/documentos.json`.

Cada clave corresponde al índice del marcador usado en MindAR:

- `"0"`: primer marcador compilado en `targets.mind`.
- `"1"`: segundo marcador compilado en `targets.mind`.

Campos admitidos:

- `codigo`
- `titulo`
- `institucion`
- `horas`
- `estado` (`VERIFICADO` o `NO VERIFICADO`)
- `temario`
- `url`

No se usa Supabase ni ninguna base de datos externa.
