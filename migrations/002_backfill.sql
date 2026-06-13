-- 历史数据归组：按片名为每个用户去重创建观影记录，再回填 scenes.movie_id
-- 幂等：已存在的电影不重复创建，已关联的台词不重复处理

-- 1. 从台词去重片名创建观影记录（year 取该组任一非空年份）
insert into public.movies (user_id, title, year)
select s.user_id, s.title, max(s.year) as year
from (
  select user_id,
         coalesce(metadata->>'movie', movie) as title,
         nullif(metadata->>'year', '')        as year
  from public.scenes
) s
where s.title is not null
  and trim(s.title) <> ''
  and not exists (
    select 1 from public.movies m
    where m.user_id = s.user_id and m.title = s.title
  )
group by s.user_id, s.title;

-- 2. 回填台词 → 观影记录关联
update public.scenes s
set movie_id = m.id
from public.movies m
where m.user_id = s.user_id
  and m.title = coalesce(s.metadata->>'movie', s.movie)
  and s.movie_id is null;
