"""입소상담 A4 안내문(admission-flyer.html) 생성 스크립트.
사용법:  pip install segno  →  python3 scripts/make_flyer.py
QR 주소·전화번호를 바꾸려면 아래 값만 수정하고 다시 실행하세요."""
import io, segno

KAKAO = "https://open.kakao.com/o/sqlsD6Yd"
SITE = "https://sungmo.vercel.app/"

def qr_svg(url):
    buf = io.BytesIO()
    segno.make(url, error="m").save(buf, kind="svg", scale=1, border=1, dark="#3B322E", omitsize=True, xmldecl=False, svgns=True)
    return buf.getvalue().decode()

HTML = """<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>입소상담 안내문 | 성모영아전담어린이집</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0}
body{background:#ddd;font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#3B322E;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;margin:10px auto;background:#FFFBF6;padding:14mm 16mm;display:flex;flex-direction:column;position:relative;overflow:hidden}
.page:before{content:"";position:absolute;inset:7mm;border:1.2mm solid #FFE7DE;border-radius:8mm;pointer-events:none}
.top{text-align:center;padding-top:4mm}
.top img{height:20mm;margin-bottom:3mm}
.eyebrow{color:#D96D51;font-weight:700;letter-spacing:.15em;font-size:13pt}
h1{font-size:38pt;line-height:1.2;margin:2mm 0;font-weight:900}
h1 em{font-style:normal;color:#EE8B70}
.sub{font-size:14pt;color:#5E524C}
.info{display:flex;gap:6mm;margin:8mm 0 6mm}
.box{flex:1;background:#fff;border:.4mm solid #F0E4DA;border-radius:5mm;padding:5mm 6mm}
.box h2{font-size:15pt;color:#D96D51;margin-bottom:3mm}
.box dl div{display:flex;gap:3mm;font-size:12.5pt;padding:1.2mm 0}
.box dt{width:22mm;font-weight:700;flex:none}
.box dd{color:#5E524C}
.steps{list-style:none;padding:0;counter-reset:s}
.steps li{counter-increment:s;font-size:12.5pt;padding:1.3mm 0 1.3mm 9mm;position:relative}
.steps li:before{content:counter(s);position:absolute;left:0;top:1.2mm;width:6.5mm;height:6.5mm;border-radius:50%;background:#EE8B70;color:#fff;font-weight:700;font-size:11pt;text-align:center;line-height:6.5mm}
.qrs{display:flex;gap:8mm;justify-content:center;margin:2mm 0 5mm}
.qr{width:78mm;text-align:center;background:#fff;border:.4mm solid #F0E4DA;border-radius:5mm;padding:5mm}
.qr svg{width:52mm;height:52mm;display:block;margin:0 auto 3mm}
.qr b{display:block;font-size:15pt}
.qr span{font-size:11pt;color:#8C7F78}
.qr.k{background:#FEE500;border-color:#FEE500}.qr.k span{color:#3C1E1E}.qr.k svg{background:#fff;border-radius:3mm;padding:1mm}
.tel{margin-top:auto;text-align:center;background:#EE8B70;color:#fff;border-radius:5mm;padding:5mm}
.tel b{font-size:26pt;letter-spacing:.03em}
.tel div{font-size:12pt;margin-top:1mm}
@media print{body{background:none}.page{margin:0}}
</style></head><body>
<div class="page">
  <div class="top">
    <img src="assets/img/logo.png" alt="" onerror="this.style.display='none'">
    <p class="eyebrow">성모영아전담어린이집</p>
    <h1>입소상담, <em>QR 한 번</em>이면<br>바로 연결됩니다</h1>
    <p class="sub">만 0~2세 영아전담 · 아이 중심, 놀이 중심 보육</p>
  </div>
  <div class="info">
    <div class="box"><h2>모집 안내</h2><dl>
      <div><dt>모집 대상</dt><dd>만 0세 ~ 만 2세 영아</dd></div>
      <div><dt>모집 시기</dt><dd>수시 모집</dd></div>
      <div><dt>운영 시간</dt><dd>평일 07:30~19:30<br>토 09:00~13:30</dd></div>
      <div><dt>주소</dt><dd>부산 수영구<br>망미로7번길 17</dd></div></dl></div>
    <div class="box"><h2>입소 절차</h2><ol class="steps">
      <li>전화·카카오톡 문의</li><li>방문 상담 및 원 견학</li>
      <li>아이사랑 입소대기 신청</li><li>입소 확정 및 서류 제출</li><li>적응 기간 시작</li></ol></div>
  </div>
  <div class="qrs">
    <div class="qr k">@KAKAO@<b>카카오톡 입소상담</b><span>카메라로 스캔하면 바로 상담</span></div>
    <div class="qr">@SITE@<b>홈페이지 보기</b><span>원 소개 · 사진 · 입소 안내</span></div>
  </div>
  <div class="tel"><b>☎ 051-751-9820</b><div>궁금한 점은 언제든 편하게 문의해 주세요 · 010-9340-8331</div></div>
</div></body></html>"""

html = HTML.replace("@KAKAO@", qr_svg(KAKAO)).replace("@SITE@", qr_svg(SITE))
open("admission-flyer.html", "w", encoding="utf-8").write(html)
print("admission-flyer.html 생성 완료")
