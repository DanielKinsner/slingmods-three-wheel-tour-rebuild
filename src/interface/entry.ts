/** Presentation only. All actions go through the showroom's existing event delegation. */
export interface TourEntry {
  model: string;
  ryker: boolean;
  careerLabel: string;
  careerDetail: string;
}
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export function tourEntry({model, ryker, careerLabel, careerDetail}: TourEntry): string {
  return `<main class="sig-entry tour-entry">
    <div class="tour-edition"><span class="tour-mark" aria-hidden="true"><i></i><i></i><i></i></span> SLINGMODS ORIGINAL <span> / 001</span></div>
    <h1>THREE<br>WHEELS.<br><em>NO LIMITS.</em></h1>
    <p class="tour-entry-copy">Your machine. Your signature.<br>The open road is yours.</p>
    <div class="sig-entry-actions tour-entry-actions">
      <button data-action="build" class="sig-primary tour-start"><span><small>THE ATELIER</small>MAKE IT YOURS</span><b aria-hidden="true">↗</b></button>
      <button data-action="career" class="sig-career-entry"><span>${escape(careerLabel)}</span><small>${escape(careerDetail)}</small><b aria-hidden="true">→</b></button>
      <button data-action="quick-race" class="sig-career-entry"><span>Just drive</span><small>Three destinations. No commitments.</small><b aria-hidden="true">→</b></button>
    </div>
  </main>
  <aside class="tour-machine" aria-label="Current vehicle"><span class="tour-machine-index">${ryker?'02':'01'}<i> / THE COLLECTION</i></span><strong>${ryker?'CAN-AM RYKER':'POLARIS SLINGSHOT'}</strong><span>${escape(model)}</span><small><i aria-hidden="true"></i> LIVE IN THE STUDIO</small></aside>
  <footer class="tour-entry-footer"><span>BUILT TO BE <b>YOURS.</b></span><span>DRAG TO ORBIT <i> / </i> SCROLL TO EXPLORE</span><button data-action="quick-race"><span>THE NEXT HORIZON</span> EXPLORE THE TOUR <b aria-hidden="true">↗</b></button></footer>`;
}
