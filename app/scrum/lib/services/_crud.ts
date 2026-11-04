/*
path :           app/scrum/lib/services/_crud.ts
tag :            ["scrum", "service", "crud", "factory", "generic"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Factory générique CRUD + reorder pour les 7 sections du
                 module Scrum (idea, feature, persona, epic, userStory,
                 sprint, task). Factorise le squelette identique qui était
                 dupliqué dans chaque service : lecture de la collection,
                 calcul de order = max + 1, génération d'id via randomUUID,
                 résolution find + replace sur update, vérification de
                 présence sur delete, normalisation d'ordre sur reorder.
                 Deux hooks optionnels permettent aux services spécialisés
                 de brancher leur logique :
                 - validate(input, doc, id?) : vérifie une contrainte
                   métier avant create/update (ex. Task : storyId doit
                   référencer une UserStory existante).
                 - afterDelete(doc, deleted) : transformation post-suppression
                   (ex. UserStory : cascade delete des tasks rattachées).
                 Aucune dépendance UI. Importable uniquement côté serveur
                 (via storage.ts → server-only).

flow:            makeCrudService(collectionKey, schema, options?) →
                 retourne { list, create, update, delete, reorder }.
                 list(flow) → readScrumFile(flow)[collectionKey].
                 create(flow, input) → schema.parse(input) → validate? →
                 order = max + 1 → push → write.
                 update(flow, id, input) → schema.parse(input) → find →
                 validate? → replace + updatedAt → write.
                 delete(flow, id) → find → filter → afterDelete? → write.
                 reorder(flow, orderedIds) → reorderInputSchema.parse →
                 valide que la longueur correspond → positionById →
                 normalise order → write.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/actions/_helpers.ts",
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/actions/feature.ts",
                   "@/app/scrum/lib/actions/global-json.ts",
                   "@/app/scrum/lib/actions/idee.ts",
                   "@/app/scrum/lib/actions/persona.ts",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/actions/task.ts",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/services/_crud.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/feature.ts",
                   "@/app/scrum/lib/services/global-json.ts",
                   "@/app/scrum/lib/services/idee.ts",
                   "@/app/scrum/lib/services/persona.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/storage.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/storage.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/validations.ts"]

imports:         ["node:crypto", "zod",
                  "@/app/scrum/lib/storage",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/validations"]

exports:         ["CrudKey", "EntityOf", "CrudOptions", "CrudService",
                  "makeCrudService"]

useBy:           ["@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/services/feature.ts",
                  "@/app/scrum/lib/services/persona.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/task.ts"]

userStories:     ["*en tant que développeur je veux un CRUD Scrum générique factorisé"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { randomUUID } from "node:crypto";
import type { z } from "zod";

import { readScrumFile, writeScrumFile } from "@/app/scrum/lib/storage";
import type { ScrumDocument, ScrumFlow } from "@/app/scrum/lib/types";
import { reorderInputSchema } from "@/app/scrum/lib/validations";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CrudKey =
  | "idea"
  | "feature"
  | "persona"
  | "epic"
  | "userStory"
  | "sprint"
  | "task";

export type EntityOf<K extends CrudKey> = ScrumDocument[K][number];

export interface CrudOptions<K extends CrudKey, TInput> {
  /**
   * Hook de validation métier, appelé avant create et update.
   * Peut lever une Error qui sera remontée telle quelle par le service
   * (et convertie en ActionResult par l'action correspondante).
   */
  readonly validate?: (
    input: TInput,
    doc: ScrumDocument,
    id?: string,
  ) => void;

  /**
   * Hook post-suppression, appelé après avoir retiré l'entité de sa
   * collection. Reçoit le document avec la collection déjà filtrée et
   * l'entité supprimée. Retourne le document final (utile pour les
   * cascades, ex. UserStory → tasks).
   */
  readonly afterDelete?: (
    doc: ScrumDocument,
    deleted: EntityOf<K>,
  ) => ScrumDocument;
}

export interface CrudService<K extends CrudKey, TInput> {
  readonly list: (flow: ScrumFlow) => Promise<readonly EntityOf<K>[]>;
  readonly create: (flow: ScrumFlow, input: TInput) => Promise<EntityOf<K>>;
  readonly update: (
    flow: ScrumFlow,
    id: string,
    input: TInput,
  ) => Promise<EntityOf<K>>;
  readonly delete: (flow: ScrumFlow, id: string) => Promise<void>;
  readonly reorder: (
    flow: ScrumFlow,
    orderedIds: readonly string[],
  ) => Promise<readonly EntityOf<K>[]>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

export function makeCrudService<
  K extends CrudKey,
  TSchema extends z.ZodTypeAny,
>(
  collectionKey: K,
  schema: TSchema,
  options: CrudOptions<K, z.input<TSchema>> = {},
): CrudService<K, z.input<TSchema>> {
  const { validate, afterDelete } = options;

  /* ------------------------------ list ------------------------------ */

  async function list(flow: ScrumFlow): Promise<readonly EntityOf<K>[]> {
    const doc = await readScrumFile(flow);
    return doc[collectionKey] as readonly EntityOf<K>[];
  }

  /* ----------------------------- create ----------------------------- */

  async function create(
    flow: ScrumFlow,
    input: z.input<TSchema>,
  ): Promise<EntityOf<K>> {
    const valid = schema.parse(input);
    const createdAt = nowIso();

    const doc = await readScrumFile(flow);
    if (validate) validate(input, doc);

    const items = doc[collectionKey] as readonly EntityOf<K>[];
    const maxOrder = items.reduce(
      (max, item) => Math.max(max, item.order ?? 0),
      -1,
    );

    const entity = {
      ...(valid as object),
      id: randomUUID(),
      order: maxOrder + 1,
      createdAt,
      updatedAt: createdAt,
    } as EntityOf<K>;

    await writeScrumFile(flow, {
      ...doc,
      [collectionKey]: [...items, entity],
    });
    return entity;
  }

  /* ----------------------------- update ----------------------------- */

  async function update(
    flow: ScrumFlow,
    id: string,
    input: z.input<TSchema>,
  ): Promise<EntityOf<K>> {
    const valid = schema.parse(input);
    const doc = await readScrumFile(flow);

    const items = doc[collectionKey] as readonly EntityOf<K>[];
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error(`[scrum/${collectionKey}] Entité introuvable : ${id}`);
    }

    if (validate) validate(input, doc, id);

    const updated = {
      ...existing,
      ...(valid as object),
      updatedAt: nowIso(),
    } as EntityOf<K>;

    const next = items.map((item) => (item.id === id ? updated : item));
    await writeScrumFile(flow, { ...doc, [collectionKey]: next });
    return updated;
  }

  /* ----------------------------- delete ----------------------------- */

  async function remove(flow: ScrumFlow, id: string): Promise<void> {
    const doc = await readScrumFile(flow);
    const items = doc[collectionKey] as readonly EntityOf<K>[];
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error(`[scrum/${collectionKey}] Entité introuvable : ${id}`);
    }

    const next = items.filter((item) => item.id !== id);
    let nextDoc: ScrumDocument = { ...doc, [collectionKey]: next };
    if (afterDelete) nextDoc = afterDelete(nextDoc, existing);

    await writeScrumFile(flow, nextDoc);
  }

  /* ---------------------------- reorder ----------------------------- */

  async function reorder(
    flow: ScrumFlow,
    orderedIds: readonly string[],
  ): Promise<readonly EntityOf<K>[]> {
    const valid = reorderInputSchema.parse({ orderedIds });
    const doc = await readScrumFile(flow);

    const items = doc[collectionKey] as readonly EntityOf<K>[];
    const idSet = new Set(items.map((item) => item.id));
    if (valid.orderedIds.length !== idSet.size) {
      throw new Error(
        `[scrum/${collectionKey}] Reorder invalide : ${valid.orderedIds.length} ids fournis, ${idSet.size} attendus.`,
      );
    }

    const positionById = new Map(
      valid.orderedIds.map((id, index) => [id, index]),
    );

    const next: readonly EntityOf<K>[] = items.map((item) => {
      const position = positionById.get(item.id);
      if (position === undefined) {
        throw new Error(
          `[scrum/${collectionKey}] Entité inconnue : ${item.id}`,
        );
      }
      return { ...item, order: position };
    });

    await writeScrumFile(flow, { ...doc, [collectionKey]: next });
    return next;
  }

  return { list, create, update, delete: remove, reorder };
}