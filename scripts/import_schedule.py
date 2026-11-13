import openpyxl, re, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
source='/Users/oleksii/Downloads/rozklad_nni_dtd 26-27 осінь.xlsx'
w=openpyxl.load_workbook(source,data_only=True)
lessons=[]; groups={}; notes=[]
days=['Понеділок','Вівторок','Середа','Четвер','П’ятниця']
for s in w:
    merges={}
    for m in s.merged_cells.ranges:
        for row in range(m.min_row,min(m.max_row,63)+1):
            for col in range(m.min_col,m.max_col+1): merges[row,col]=m
    def val(row,col):
        m=merges.get((row,col));return s.cell(m.min_row,m.min_col).value if m else s.cell(row,col).value
    headers={c.column:re.sub(r'\s+','',c.value) for c in s[10] if isinstance(c.value,str) and re.search(r'-\s*\d',c.value)}
    for g in headers.values(): groups[g]={'id':g,'base':g.split('/')[0],'direction':g.split('-')[0],'sheet':s.title.strip()}
    for row in range(11,63):
        if str(s.cell(row,4).value).lower() not in ['н','п']:continue
        day=(row-11)//11
        for col,g in headers.items():
            raw=val(row,col)
            if not raw:continue
            raw=re.sub(r'\s+',' ',str(raw)).strip()
            if 'САМОСТІЙНОЇ' in raw:continue
            m=merges.get((row,col));anchor=s.cell(m.min_row,m.min_col).coordinate if m else s.cell(row,col).coordinate
            teacher=re.search(r'\(([^()]*)\)\s*$',raw)
            location_note=teacher.group(1) if teacher and re.search(r'зал|ауд|стадіон',teacher.group(1),re.I) else ''
            teachers=[x.strip() for x in teacher.group(1).split(',')] if teacher and not location_note else []
            title=raw[:teacher.start()].strip() if teacher else raw
            typ='lab' if re.match(r'^л\s*\.',title,re.I) else 'practice' if re.match(r'^(?:пр|п|практ)\s*\.',title,re.I) else 'lecture'
            title=re.sub(r'^(?:л|пр|п|практ)\s*\.\s*','',title,flags=re.I)
            room=re.search(r'\s+а\s*\.\s*([^ ]+)',title)
            building=re.search(r'к\s*\.\s*(\d+)',title)
            subject=title[:room.start()].strip() if room else re.sub(r'\s+\d+[а-яА-Я]?\s+к\..*','',title).strip()
            lessons.append({'id':s.title.strip()+':'+anchor,'sheet':s.title.strip(),'cell':anchor,'day':day,'slot':int(val(row,2)), 'time':str(val(row,3)).replace('.',':'),'parity':str(s.cell(row,4).value).lower(),'group':g,'subject':subject,'type':typ,'teachers':teachers,'room':room.group(1) if room else location_note, 'building':building.group(1) if building else '', 'raw':raw})
notes=['Аркуш ТДБ містить заголовок 2025/2026; дані показані як частина наданого файлу 2026/2027.','ДТС, маг!F64:F65: Матеріалознавство — поза сіткою, без дня та часу; не включено до розкладу.','ДТС, маг!G24: Хімія дерев (Салівон Н.Ф.) — колонка без заголовка групи; не включено, потрібне уточнення.','л. = лабораторна, пр./п. = практична, без префікса = лекція (за умовою замовника).','Час 5-ї пари 16:20–17:35 збережено з джерела.','Варіанти написання прізвищ та ініціалів збережено окремо: їх потрібно звірити перед об’єднанням викладачів.']
data={'lessons':lessons,'groups':list(groups.values()),'notes':notes,'source':pathlib.Path(source).name}
(ROOT/'data/schedule.js').write_text('window.SCHEDULE = '+json.dumps(data,ensure_ascii=False)+';',encoding='utf8')
md=pathlib.Path('/Users/oleksii/Downloads/nltu_187_bakalavrat_predmety.md').read_text()
plan=[]
for sem,subjects in re.findall(r'\| \*\*(\d) семестр\*\* \| (.*?) \|',md):
    for subject in subjects.split('; '):
        category='general' if re.search('мова|історія|хімія|математика|фізика|Філософія|фізичне|безпека|охорони праці|Економіка',subject,re.I) else 'profile'
        if 'вибіркові' in subject:category='extra'
        plan.append({'semester':int(sem),'name':subject,'category':category})
for year,names in {2:['Маркетинг інновацій','Інвестування','Техніко-економічне обґрунтування інвестиційних проєктів'],3:['Бізнес-планування','Електронний бізнес','Бізнес-комунікації','Природоохоронне законодавство'],4:['Статистичні методи підвищення якості продукції','Бізнес-моделювання','Технологія ґратчастих меблів','Промисловий дизайн']}.items():
    for name in names:plan.append({'semester':year*2-1,'name':name,'category':'extra','optional':True})
(ROOT/'data/plan.js').write_text('window.PLAN = '+json.dumps(plan,ensure_ascii=False)+';',encoding='utf8')
print(json.dumps({'records':len(lessons),'groups':len(groups),'sheets':len(w.sheetnames),'plan':len(plan)}))
