(() => {
  "use strict";
  const PRODUCTS = {
    "Tote Bag": 65000, "Lanyard": 25000, "Tas Ransel": 125000,
    "Pulpen Mekanik": 5000, "Tumbler": 25000, "Gantungan Kunci": 10000,
    "Jaket Almamater": 250000, "Kaos": 85000
  };
  const EMOJI = {"Tote Bag":"👜","Lanyard":"🎗️","Tas Ransel":"🎒","Pulpen Mekanik":"🖊️","Tumbler":"🥤","Gantungan Kunci":"🔑","Jaket Almamater":"🧥","Kaos":"👕"};
  const CART_KEY = "shopKampusCartV1";
  const money = n => new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n).replace(/\u00a0/g," ");
  function getCart(){ try { const value=JSON.parse(localStorage.getItem(CART_KEY)||"{}"); return value && typeof value==="object" ? value : {}; } catch { return {}; } }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); renderOrderSummary(); }
  function countItems(cart=getCart()){ return Object.values(cart).reduce((sum,qty)=>sum+qty,0); }
  function total(cart=getCart()){ return Object.entries(cart).reduce((sum,[name,qty])=>sum+(PRODUCTS[name]||0)*qty,0); }
  let toastTimer;
  function toast(message){ const el=document.getElementById("toast"); if(!el)return; el.textContent=message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2400); }
  function renderCount(){ const count=countItems(); document.querySelectorAll("#cart-count").forEach(el=>el.textContent=count); }
  function renderCart(){
    renderCount();
    const container=document.getElementById("cart-items"); if(!container)return;
    const cart=getCart(), entries=Object.entries(cart).filter(([name,qty])=>PRODUCTS[name]&&qty>0);
    const count=countItems(cart), subtotal=total(cart);
    const summaryCount=document.getElementById("summary-count"), subtotalEl=document.getElementById("subtotal"), checkout=document.getElementById("checkout-button");
    if(summaryCount)summaryCount.textContent=`${count} item`;
    if(subtotalEl)subtotalEl.textContent=money(subtotal);
    if(checkout)checkout.disabled=count===0;
    if(!entries.length){container.innerHTML='<div class="empty-cart"><span>🛍️</span><h3>Keranjangmu masih kosong</h3><p>Yuk, pilih produk yang kamu suka.</p><a href="#produk" class="btn btn-primary">Lihat produk</a></div>';return;}
    container.innerHTML=entries.map(([name,qty])=>`<div class="cart-row"><div class="cart-thumb">${EMOJI[name]||"🛍️"}</div><div><div class="cart-product-name">${name}</div><div class="cart-product-price">${money(PRODUCTS[name])} / item</div><div class="qty-control"><button type="button" data-qty="-1" data-name="${name}" aria-label="Kurangi ${name}">−</button><span>${qty}</span><button type="button" data-qty="1" data-name="${name}" aria-label="Tambah ${name}">+</button></div></div><div class="cart-row-total">${money(PRODUCTS[name]*qty)}<button class="remove-item" type="button" data-remove="${name}">Hapus</button></div></div>`).join("");
  }
  function renderOrderSummary(){
    renderCount();
    const container=document.getElementById("order-items");if(!container)return;
    const cart=getCart(),entries=Object.entries(cart).filter(([name,qty])=>PRODUCTS[name]&&qty>0);
    const count=document.getElementById("order-count"),sum=document.getElementById("order-total");
    if(count)count.textContent=`${countItems(cart)} item`;
    if(sum)sum.textContent=money(total(cart));
    container.innerHTML=entries.length?entries.map(([name,qty])=>`<div class="order-item"><span>${name} × ${qty}</span><strong>${money(PRODUCTS[name]*qty)}</strong></div>`).join(""):'<p class="summary-note">Keranjang kosong. Silakan pilih produk terlebih dahulu.</p>';
  }

  // ===== Menu mobile (hamburger) =====
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "✕" : "☰";
    });
    mainNav.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        mainNav.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.textContent = "☰";
      })
    );
    // Tutup menu saat klik di luar
    document.addEventListener("click", (e) => {
      if (!mainNav.classList.contains("nav-open")) return;
      if (mainNav.contains(e.target) || navToggle.contains(e.target)) return;
      mainNav.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.textContent = "☰";
    });
  }

  document.addEventListener("click", event=>{
    const add=event.target.closest("[data-add]");
    if(add){const name=add.dataset.add;if(!PRODUCTS[name])return;const cart=getCart();cart[name]=(cart[name]||0)+1;saveCart(cart);toast(`${name} ditambahkan ke keranjang`);return;}
    const qtyButton=event.target.closest("[data-qty]");
    if(qtyButton){const cart=getCart(),name=qtyButton.dataset.name;cart[name]=(cart[name]||0)+Number(qtyButton.dataset.qty);if(cart[name]<=0)delete cart[name];saveCart(cart);return;}
    const remove=event.target.closest("[data-remove]");
    if(remove){const cart=getCart();delete cart[remove.dataset.remove];saveCart(cart);toast("Produk dihapus dari keranjang");return;}
    if(event.target.closest("#clear-cart")){localStorage.removeItem(CART_KEY);renderCart();renderOrderSummary();toast("Keranjang dikosongkan");return;}
    if(event.target.closest("#checkout-button")){if(!countItems())return;window.location.href="pesan.html";return;}
    if(event.target.closest("#copy-order")){const text=document.getElementById("confirmation-text")?.textContent||"";if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast("Ringkasan berhasil disalin")).catch(()=>fallbackCopy(text));}else fallbackCopy(text);}
  });
  function fallbackCopy(text){const area=document.createElement("textarea");area.value=text;document.body.appendChild(area);area.select();try{document.execCommand("copy");toast("Ringkasan disalin");}catch{toast("Silakan salin ringkasan secara manual");}area.remove();}
  const form=document.getElementById("order-form");
  if(form){form.addEventListener("submit",async event=>{
    event.preventDefault();
    const cart=getCart();
    if(!countItems(cart)){toast("Keranjang masih kosong. Pilih produk terlebih dahulu.");return;}
    const submitButton=form.querySelector('button[type="submit"]');
    const originalText=submitButton?.textContent || "Simpan pesanan";
    if(submitButton){submitButton.disabled=true;submitButton.textContent="Menyimpan pesanan…";}
    const data=new FormData(form);
    const payload={
      nama:String(data.get("nama")||"").trim(),
      email:String(data.get("email")||"").trim(),
      telepon:String(data.get("telepon")||"").trim(),
      penerimaan:String(data.get("penerimaan")||""),
      catatan:String(data.get("alamat")||"").trim(),
      items:Object.entries(cart).filter(([name,qty])=>PRODUCTS[name]&&Number.isInteger(qty)&&qty>0).map(([produk,jumlah])=>({produk,jumlah}))
    };
    try{
      const response=await fetch("simpan.php",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok||!result.success)throw new Error(result.message||"Pesanan gagal disimpan.");
      const lines=["PEMESANAN SHOP KAMPUS UIN SYAHADA","",`Nomor pesanan: #${result.order_id}`,`Nama: ${payload.nama}`,`Email: ${payload.email}`,`WhatsApp: ${payload.telepon||"-"}`,`Penerimaan: ${payload.penerimaan}`,`Alamat/catatan: ${payload.catatan||"-"}`,"","DAFTAR PRODUK:",...payload.items.map(({produk,jumlah})=>`- ${produk} x ${jumlah} = ${money(PRODUCTS[produk]*jumlah)}`),"",`Total item: ${result.total_item}`,`TOTAL SEMENTARA: ${money(result.total)}`,"","Catatan: total belum termasuk ongkos kirim.","Status: pesanan tersimpan di database."];
      document.getElementById("confirmation-text").textContent=lines.join("\n");
      const panel=document.getElementById("confirmation-panel");
      panel.querySelector(".eyebrow").textContent="PESANAN TERSIMPAN";
      panel.querySelector("h2").textContent=`Pesanan #${result.order_id} berhasil disimpan!`;
      panel.hidden=false;
      localStorage.removeItem(CART_KEY);renderCart();renderOrderSummary();
      form.reset();
      if(submitButton)submitButton.textContent="Pesanan tersimpan ✓";
      panel.scrollIntoView({behavior:"smooth",block:"start"});
      toast("Pesanan berhasil disimpan ke database.");
    }catch(error){
      toast(error.message||"Tidak dapat terhubung ke server.");
      const panel=document.getElementById("confirmation-panel");
      panel.querySelector(".eyebrow").textContent="PESANAN BELUM TERSIMPAN";
      panel.querySelector("h2").textContent="Gagal menyimpan pesanan";
      document.getElementById("confirmation-text").textContent=(error.message||"Periksa koneksi server dan database.")+"\n\nData keranjang tetap disimpan. Silakan coba lagi.";
      panel.hidden=false;
    }finally{
      if(submitButton&&submitButton.textContent!=="Pesanan tersimpan ✓"){submitButton.disabled=false;submitButton.textContent=originalText;}
    }
  });}

  renderCart();renderOrderSummary();
})();