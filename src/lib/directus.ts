// src/lib/directus.ts

import { createDirectus, rest } from '@directus/sdk';

// A URL base da API é definida de forma segura usando a variável de ambiente.
const DIRECTUS_BASE_URL = import.meta.env.PUBLIC_DIRECTUS_URL || 'https://directus.maisperto.com.br/';

// Cria a instância do cliente Directus.
const client = createDirectus(DIRECTUS_BASE_URL).with(rest());

export default client;