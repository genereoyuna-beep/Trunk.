// ================= Google の場所の候補（Trunk. だけ） =================
// 宿の名前・住所・予定の場所・都市を打つと、Google の候補を出す。
// 新しい Places API（AutocompleteSuggestion）が使えなければ、従来の AutocompleteService を使う。
const Places = {
  loading: null, token: null,
  load() {
    if (window.google && google.maps && google.maps.places) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = new Promise((ok, ng) => {
      window.__placesReady = () => ok();
      window.gm_authFailure = () => { this.broken = true; };
      const s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + MAPS_KEY + "&libraries=places&language=ja&region=JP&loading=async&callback=__placesReady";
      s.async = true; s.onerror = () => { this.loading = null; ng(new Error("maps")); };
      document.head.appendChild(s);
    });
    return this.loading;
  },
  session() { if (!this.token) this.token = new google.maps.places.AutocompleteSessionToken(); return this.token; },
  // キーが使えないなどで Google が返事をしないときは、5秒で候補なしにする（入力が固まらないように）
  suggest(input, kind) {
    if (this.broken) return Promise.resolve([]);
    return Promise.race([this._suggest(input, kind), new Promise(ok => setTimeout(() => ok([]), 5000))]);
  },
  // kind: "city"（都市）／それ以外（施設・住所）
  async _suggest(input, kind) {
    const q = String(input || "").trim();
    if (q.length < 2) return [];
    await this.load();
    const P = google.maps.places;
    if (P.AutocompleteSuggestion) {
      try {
        const req = { input: q, sessionToken: this.session(), language: "ja" };
        if (kind === "city") req.includedPrimaryTypes = ["locality", "administrative_area_level_1"];
        const { suggestions } = await P.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        return (suggestions || []).filter(x => x.placePrediction).slice(0, 6).map(x => {
          const p = x.placePrediction;
          return { main: p.mainText ? p.mainText.text : p.text.text, sub: p.secondaryText ? p.secondaryText.text : "", pick: async () => {
            const place = p.toPlace();
            await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
            this.token = null;
            return { name: place.displayName || "", address: place.formattedAddress || "", lat: place.location ? place.location.lat() : null, lng: place.location ? place.location.lng() : null };
          } };
        });
      } catch (e) { /* 新しい API が使えないときは下へ */ }
    }
    const svc = this._svc || (this._svc = new P.AutocompleteService());
    const preds = await new Promise(ok => svc.getPlacePredictions({ input: q, sessionToken: this.session(), language: "ja", types: kind === "city" ? ["(cities)"] : undefined }, (r) => ok(r || [])));
    return preds.slice(0, 6).map(p => ({ main: p.structured_formatting ? p.structured_formatting.main_text : p.description, sub: p.structured_formatting ? p.structured_formatting.secondary_text || "" : "", pick: () => new Promise(ok => {
      const ps = this._ps || (this._ps = new P.PlacesService(document.createElement("div")));
      ps.getDetails({ placeId: p.place_id, fields: ["name", "formatted_address", "geometry"], sessionToken: this.session(), language: "ja" }, (d) => {
        this.token = null;
        ok(d ? { name: d.name || "", address: d.formatted_address || "", lat: d.geometry ? d.geometry.location.lat() : null, lng: d.geometry ? d.geometry.location.lng() : null } : { name: p.description, address: "" });
      });
    }) }));
  },
};
