// src/lib/api.ts (CONTEÚDO COMPLETO E CORRIGIDO)
import client from './directus';
import { readItems, readItem } from '@directus/sdk';

// --- Configurações da API e Variáveis de Ambiente ---
export const ID_SJC = 3; 
export const ID_JARDIM_AQUARIUS = 122; // ID para o bairro de referência

// Lista GATILHO dos IDs das 8 categorias Nv1 (Ajuste se necessário)
export const NV1_IDS = [1, 47, 81, 124, 156, 186, 221, 249]; 

// --- Tipagem ---
interface Bairro {
    slug_bairro: string;
    nome_bairro: string;
}

interface Category {
    id: number;
    nome_nicho: string;
    full_slug_nicho: string;
    nivel_nicho: number;
    slug_nicho: string;
    descricao_curta_nicho?: string;
}

// --- Funções Auxiliares de Formato ---
export const toUrlSlug = (slug: string) => slug.replace(/_/g, '-');
export const toDirectusSlug = (slug: string) => slug.replace(/-/g, '_');
export const formatSlug = (slug: string) => slug.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());


// --- Funções de Busca da API (Usando SDK) ---

/** Consulta todos os bairros de SJC (USADO NO INDEX.ASTRO). */
export async function fetchAllBairros(): Promise<Bairro[]> {
    const bairrosData = await client.request(
        readItems('mp_bairros', {
            filter: {
                cidade_relacionada: {
                    id: { _eq: ID_SJC }
                }
            },
            fields: ['slug_bairro', 'nome_bairro'],
            sort: ['nome_bairro'],
            limit: -1
        })
    ) as Bairro[];

    return bairrosData || [];
}

/** Consulta o slug do Bairro de Referência (Jardim Aquarius - ID 122). */
export async function fetchReferenciaBairroSlug(): Promise<string> {
    try {
        const bairroData = await client.request(
            readItem('mp_bairros', ID_JARDIM_AQUARIUS, {
                fields: ['slug_bairro']
            })
        ) as { slug_bairro: string };
        
        return bairroData.slug_bairro;
    } catch (e) {
        return 'jardim_aquarius'; 
    }
}

/**
 * Busca o nome formatado do bairro a partir do slug.
 */
export async function fetchBairroData(directusBairroSlug: string) {
    const bairroData = await client.request(
        readItems('mp_bairros', {
            filter: {
                cidade_relacionada: { id: { _eq: ID_SJC } },
                slug_bairro: { _eq: directusBairroSlug }
            },
            fields: ['nome_bairro'],
            limit: 1
        })
    ) as Bairro[];

    return bairroData && bairroData.length > 0 ? bairroData[0].nome_bairro : null; 
}


/**
 * Busca todas as categorias do Directus.
 */
export async function fetchAllCategories(): Promise<Category[]> {
    const allCategoriesData = await client.request(
        readItems('mp_categorias_locais', {
            fields: ['id', 'nome_nicho', 'full_slug_nicho', 'nivel_nicho', 'slug_nicho', 'descricao_curta_nicho'],
            limit: -1 
        })
    ) as Category[];
    
    return allCategoriesData || [];
}

/**
 * Agrupa as categorias NV2 e NV3 sob seus pais NV1, usando a lista NV1_IDS como filtro de raiz.
 */
export function groupCategories(allCategories: Category[]) {
    const groupedCategories: Record<string, any> = {};
    
// 1. Inicializar os Nv1s que são raízes (KEY: slug_nicho, que é o underscore/Directus slug)
    const nv1RootCategorias = allCategories.filter(
        c => Number(c.nivel_nicho) === 1 && NV1_IDS.includes(Number(c.id))
    );

    nv1RootCategorias.forEach(cat => {
        // Usar o slug_nicho (underscore) como chave. Ex: 'alimentos_e_bebidas'
        const directusSlugKey = cat.slug_nicho; 
        groupedCategories[directusSlugKey] = {
            data: cat,
            nv2: [],
            nv3: []
        };
    });

    // 2. Classificar o restante das categorias (Nv2 e Nv3)
    const subCategorias = allCategories.filter(c => Number(c.nivel_nicho) > 1);

    subCategorias.forEach(cat => {
        const fullSlug = cat.full_slug_nicho; // Ex: 'alimentos-e-bebidas/restaurantes' (Hyphenated)
        
        // Extrai a parte Nv1 do fullSlug (Hyphenated)
        const nv1RootUrlSlug = fullSlug.split('/')[0];
        
        // Converte o slug Nv1 de URL (hyphenated) para o slug de Directus (underscore) para bater a chave
        const nv1RootDirectusSlug = toDirectusSlug(nv1RootUrlSlug); // Usa a função toDirectusSlug

        // Se a categoria Nv1 (keyada por slug_nicho) existe no nosso objeto de agrupamento
        if (groupedCategories[nv1RootDirectusSlug]) {
            if (Number(cat.nivel_nicho) === 2) {
                groupedCategories[nv1RootDirectusSlug].nv2.push(cat);
            } else if (Number(cat.nivel_nicho) === 3) {
                groupedCategories[nv1RootDirectusSlug].nv3.push(cat);
            }
        }
    });

    // 3. Retorna apenas os grupos que contêm as categorias Nv1 de interesse
    return Object.values(groupedCategories);
}