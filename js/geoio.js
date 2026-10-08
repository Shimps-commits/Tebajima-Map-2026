// GeoJSON / categories.json の書き出し・読み込み（編集モード）
function downloadText(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportAll() {
  downloadText('hazards.geojson', JSON.stringify(hazardData, null, 2));
  // ブラウザによっては、複数ダウンロードの許可を求められる
  setTimeout(() => downloadText('categories.json', JSON.stringify(CATS, null, 2)), 400);
  Edit.exportedAt = nowISO();
  persist(); updateEditUI();
  if (Panel.isOpen('edit-home')) Panel.refresh();
  toast('2つのファイルを書き出しました。GitHub の data フォルダに上書きアップロードしてください。', { ms: 9000 });
}

function validateGeoJSON(j) {
  if (!j || j.type !== 'FeatureCollection' || !Array.isArray(j.features)) return 'FeatureCollection ではありません';
  for (const f of j.features) {
    const c = f && f.geometry && f.geometry.coordinates;
    if (!f.properties || f.geometry.type !== 'Point' || !Array.isArray(c) || !isFinite(c[0]) || !isFinite(c[1])) return 'ピン（Point）の形式が正しくないデータがあります';
  }
  return '';
}
function validateCats(j) {
  return j && Array.isArray(j.categories) && Array.isArray(j.severities) && j.categories.length && j.severities.length ? '' : 'categories.json の形式ではありません';
}

function importFiles() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.multiple = true; inp.accept = '.geojson,.json,application/json';
  inp.onchange = async () => {
    const msgs = [];
    let newH = null, newC = null;
    for (const file of inp.files) {
      try {
        const j = JSON.parse(await file.text());
        if (j.type === 'FeatureCollection') {
          const err = validateGeoJSON(j);
          err ? msgs.push(file.name + '：' + err) : (newH = j);
        } else {
          const err = validateCats(j);
          err ? msgs.push(file.name + '：' + err) : (newC = j);
        }
      } catch (e) { msgs.push(file.name + '：読み込めません（JSONではありません）'); }
    }
    if (msgs.length) await noticeBox('読み込めなかったファイルがあります', msgs.join('\n'));
    if (!newH && !newC) return;
    const what = [newH && '危険個所 ' + newH.features.length + ' 件', newC && '種別 ' + newC.categories.length + '・危険度 ' + newC.severities.length].filter(Boolean).join('、');
    if (!(await confirmBox('読み込みますか？', what + ' を読み込み、現在の編集内容を置き換えます。「元に戻す」で戻せます。', '読み込む', false))) return;
    Edit.mutate(() => {
      if (newC) CATS = migrateCats(newC);
      if (newH) {
        hazardData = newH;
        hazardData.features.forEach(f => { if (!f.properties.id) f.properties.id = newId(); });
      }
    });
    toast('読み込みました（' + what + '）');
  };
  inp.click();
}
