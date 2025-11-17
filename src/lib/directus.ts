// --- Configurações da API ---
const DIRECTUS_API_URL = 'https://directus.maisperto.com.br/items/'; 
export const ID_SJC = 3; 
// Lista GATILHO dos IDs das 8 categorias Nv1 (AGORA CORRIGIDA com base no CSV)
export const NV1_IDS = [1, 47, 81, 124, 156, 186, 221, 249]; // <-- A LISTA CORRETA

// --- Tipagem (Opcional, mas boa prática) ---
interface Category {
    id: number;
    nome_nicho: string;
    full_slug_nicho: string;
    nivel_nicho: number;
}

// --- Funções Auxiliares de Formato ---

/** Converte o slug do Astro (hifenizado) para o slug do Directus (underscore) */
export const toDirectusSlug = (slug: string) => slug.replace(/-/g, '_');

/** Formata o slug do Directus para nome de exibição */
export const formatSlug = (slug: string) => slug.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());


// --- Funções de Busca da API ---

/**
 * Busca o nome formatado do bairro a partir do slug.
 */
export async function fetchBairroData(directusBairroSlug: string) {
    const bairroResponse = await fetch(
        `${DIRECTUS_API_URL}mp_bairros?filter[cidade_relacionada][id]=${ID_SJC}&filter[slug_bairro][_eq]=${directusBairroSlug}&fields=nome_bairro`
    );
    const bairroData = await bairroResponse.json();

    return bairroData.data && bairroData.data.length > 0 
        ? bairroData.data[0].nome_bairro 
        : null; 
}

/**
 * Busca todas as categorias do Directus (com limit=-1 para pegar todos os registros).
 */
export async function fetchAllCategories(): Promise<Category[]> {
    const allCategoriesResponse = await fetch(
        `${DIRECTUS_API_URL}mp_categorias_locais?fields=id,nome_nicho,full_slug_nicho,nivel_nicho&limit=-1` 
    );
    const allCategoriesData = await allCategoriesResponse.json();
    return allCategoriesData.data || [];
}

/**
 * Agrupa as categorias NV2 e NV3 sob seus pais NV1, usando a lista NV1_IDS como filtro de raiz.
 */
export function groupCategories(allCategories: Category[]) {
    const groupedCategories: Record<string, any> = {};

    // PASSO 1: Filtrar todas as categorias, removendo itens sem slug ou nome.
    const filteredCategories = allCategories.filter(cat => 
        cat.full_slug_nicho && cat.nome_nicho && Number(cat.nivel_nicho)
    );

    // PASSO 2: Identificar Nv2 e Nv3.
    const allNv2Nv3 = filteredCategories.filter(c => 
        Number(c.nivel_nicho) === 2 || Number(c.nivel_nicho) === 3
    );

    // PASSO 3: Inicializar Grupos SOMENTE com os 8 IDs de Nv1 válidos.
    const nv1RootCategorias = filteredCategories.filter(c => 
        Number(c.nivel_nicho) === 1 && NV1_IDS.includes(Number(c.id))
    );

    nv1RootCategorias.forEach(cat => {
        const slug = cat.full_slug_nicho;
        groupedCategories[slug] = {
            data: cat,
            nv2: [],
            nv3: []
        };
    });

    // PASSO 4: Anexar Nv2 e Nv3 aos 8 pais existentes.
    allNv2Nv3.forEach(cat => {
        const nv1Slug = cat.full_slug_nicho.split('/')[0]; 
        const level = Number(cat.nivel_nicho);

        if (groupedCategories[nv1Slug]) {
            if (level === 2) {
                groupedCategories[nv1Slug].nv2.push(cat);
            } else if (level === 3) {
                groupedCategories[nv1Slug].nv3.push(cat);
            }
        }
    });

    // PASSO 5: Cria um ARRAY final limpo para o loop de renderização.
    const finalGroups = Object.values(groupedCategories).filter(group => 
        group && group.data && group.data.full_slug_nicho && group.data.nome_nicho
    );
    
    return finalGroups;
}