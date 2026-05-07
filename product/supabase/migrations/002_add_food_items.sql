create table if not exists public.food_items (
  id            serial primary key,
  code          text not null unique,
  name          text not null,
  scientific    text,
  lang_names    text,
  food_group    text,

  -- Macros (per 100g)
  energy_kcal   numeric(8,2),
  water_g       numeric(8,2),
  protein_g     numeric(8,2),
  fat_g         numeric(8,2),
  carbs_g       numeric(8,2),
  fiber_g       numeric(8,2),
  sugar_g       numeric(8,2),
  sat_fat_g     numeric(8,2),
  cholesterol_mg numeric(8,2),

  -- Vitamins (per 100g)
  vit_c_mg      numeric(8,3),
  vit_a_mcg     numeric(8,3),
  thiamine_mg   numeric(8,4),
  riboflavin_mg numeric(8,4),
  niacin_mg     numeric(8,3),
  vit_b6_mg     numeric(8,4),
  folate_mcg    numeric(8,2),
  beta_carotene_mcg numeric(8,2),

  -- Minerals (per 100g)
  calcium_mg    numeric(8,2),
  iron_mg       numeric(8,3),
  magnesium_mg  numeric(8,2),
  phosphorus_mg numeric(8,2),
  potassium_mg  numeric(8,2),
  sodium_mg     numeric(8,2),
  zinc_mg       numeric(8,3),

  created_at    timestamptz default now()
);

-- Full-text search index on name
create index if not exists food_items_name_idx on public.food_items using gin(to_tsvector('english', name));
create index if not exists food_items_group_idx on public.food_items(food_group);

-- RLS: public read, no write from client
alter table public.food_items enable row level security;
create policy "food_items_read" on public.food_items for select using (true);
