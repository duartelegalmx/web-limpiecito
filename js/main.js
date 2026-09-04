document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     MENÚ MÓVIL
  ========================================================= */

  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("active");

      menuToggle.setAttribute(
        "aria-expanded",
        open ? "true" : "false"
      );

      menuToggle.textContent = open ? "×" : "☰";
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
      });
    });
  }


  /* =========================================================
     ANIMACIONES DE ENTRADA
  ========================================================= */

  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("visible");
    });
  }


  /* =========================================================
     DIAGNÓSTICO IA
  ========================================================= */

  const diagForm = document.getElementById("diag-form");
  const caseText = document.getElementById("case-text");
  const analyzeBtn = document.getElementById("analyze-btn");
  const resetBtn = document.getElementById("reset-btn");

  const statusLabel = document.getElementById("status-label");
  const diagError = document.getElementById("diag-error");
  const diagResult = document.getElementById("diag-result");

  const gaugeArc = document.getElementById("gauge-arc");
  const gaugeText = document.getElementById("gauge-text");

  const resultTitle = document.getElementById("result-title");
  const resultBadge = document.getElementById("result-badge");
  const resultSummary = document.getElementById("result-summary");
  const resultFactors = document.getElementById("result-factors");
  const resultNext = document.getElementById("result-next");


  let lastDiagnosis = null;
  let lastCase = "";


  function showError(message) {
    if (!diagError) return;

    diagError.textContent = message;
    diagError.hidden = false;
  }


  function clearError() {
    if (!diagError) return;

    diagError.textContent = "";
    diagError.hidden = true;
  }


  function setLoading(loading) {
    if (!analyzeBtn) return;

    analyzeBtn.disabled = loading;

    if (loading) {
      analyzeBtn.dataset.originalText =
        analyzeBtn.textContent;

      analyzeBtn.textContent =
        "Analizando…";

      if (statusLabel) {
        statusLabel.textContent =
          "Duarte está analizando tu caso";
      }
    } else {
      analyzeBtn.textContent =
        analyzeBtn.dataset.originalText ||
        "Evaluar mi caso";

      if (statusLabel) {
        statusLabel.textContent = "";
      }
    }
  }


  function normalizeViability(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return 0;
    }

    return Math.max(0, Math.min(100, number));
  }


  function renderFactors(factors) {
    if (!resultFactors) return;

    resultFactors.innerHTML = "";

    if (!Array.isArray(factors)) {
      return;
    }

    factors.forEach((factor) => {
      const li = document.createElement("li");

      if (typeof factor === "string") {
        li.textContent = factor;
      } else if (factor && typeof factor === "object") {
        li.textContent =
          factor.text ||
          factor.descripcion ||
          factor.description ||
          JSON.stringify(factor);
      }

      resultFactors.appendChild(li);
    });
  }


  function renderGauge(value) {
    if (!gaugeArc || !gaugeText) return;

    const percentage = normalizeViability(value);

    gaugeText.textContent =
      `${Math.round(percentage)}%`;

    /*
      El arco se anima utilizando una circunferencia.
      Si el SVG no tiene la medida esperada, simplemente
      dejamos visible el porcentaje.
    */

    const length =
      typeof gaugeArc.getTotalLength === "function"
        ? gaugeArc.getTotalLength()
        : 100;

    gaugeArc.style.strokeDasharray = `${length}`;
    gaugeArc.style.strokeDashoffset =
      length - (length * percentage) / 100;
  }


  function renderDiagnosis(data) {
    if (!data) return;

    lastDiagnosis = data;

    if (resultTitle) {
      resultTitle.textContent =
        data.titulo ||
        "Evaluación preliminar";
    }

    if (resultBadge) {
      const value = normalizeViability(data.viabilidad);

      resultBadge.textContent =
        value >= 70
          ? "Favorable"
          : value >= 40
            ? "Requiere revisión"
            : "Atención prioritaria";
    }

    if (resultSummary) {
      resultSummary.textContent =
        data.resumen ||
        "La información proporcionada requiere una revisión jurídica más detallada.";
    }

    renderFactors(data.factores);

    if (resultNext) {
      resultNext.textContent =
        data.siguiente_paso ||
        "El siguiente paso es revisar el caso con Duarte.";
    }

    renderGauge(data.viabilidad);

    if (diagResult) {
      diagResult.hidden = false;
      diagResult.style.display = "block";

      setTimeout(() => {
        diagResult.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }
  }


  async function analyzeCase() {

    clearError();

    if (!caseText) return;

    const text = caseText.value.trim();

    if (!text) {
      showError(
        "Cuéntanos brevemente qué está ocurriendo para poder evaluarlo."
      );
      caseText.focus();
      return;
    }

    if (text.length < 30) {
      showError(
        "Necesitamos un poco más de contexto. Describe brevemente qué ocurrió, quiénes intervienen y qué necesitas resolver."
      );
      caseText.focus();
      return;
    }

    if (text.length > 12000) {
      showError(
        "El texto es demasiado largo. Resume tu situación en un máximo de 12,000 caracteres."
      );
      caseText.focus();
      return;
    }

    lastCase = text;

    setLoading(true);

    try {

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          caso: text
        })
      });


      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "El servidor no devolvió una respuesta válida."
        );
      }


      if (!response.ok) {
        throw new Error(
          data?.error ||
          "No fue posible analizar el caso."
        );
      }


      if (!data || typeof data !== "object") {
        throw new Error(
          "La respuesta del diagnóstico no es válida."
        );
      }


      sessionStorage.setItem(
        "duarte_diagnosis",
        JSON.stringify({
          caso: lastCase,
          diagnosis: data,
          created_at: new Date().toISOString()
        })
      );


      renderDiagnosis(data);

      setupLeadCapture();

    } catch (error) {

      console.error("Error en diagnóstico:", error);

      showError(
        error?.message ||
        "No fue posible realizar el diagnóstico. Inténtalo nuevamente."
      );

    } finally {

      setLoading(false);

    }
  }


  if (diagForm) {
    diagForm.addEventListener("submit", (event) => {
      event.preventDefault();
      analyzeCase();
    });
  }


  if (analyzeBtn && !diagForm) {
    analyzeBtn.addEventListener("click", analyzeCase);
  }


  if (resetBtn) {
    resetBtn.addEventListener("click", () => {

      if (caseText) {
        caseText.value = "";
        caseText.focus();
      }

      if (diagResult) {
        diagResult.hidden = true;
      }

      clearError();

      lastDiagnosis = null;
      lastCase = "";

      sessionStorage.removeItem(
        "duarte_diagnosis"
      );

      const leadSection =
        document.getElementById("continuar");

      if (leadSection) {
        leadSection.hidden = true;
      }

    });
  }


  /* =========================================================
     CAPTURA DE LEAD
  ========================================================= */

  function setupLeadCapture() {

    const leadSection =
      document.getElementById("continuar");

    if (!leadSection) {
      return;
    }

    leadSection.hidden = false;

    const leadForm =
      document.getElementById("lead-form");

    if (!leadForm) {
      return;
    }

    /*
      Evitamos registrar dos veces el mismo listener
      si el usuario vuelve a ejecutar un diagnóstico.
    */

    if (leadForm.dataset.ready === "true") {
      leadSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      return;
    }

    leadForm.dataset.ready = "true";


    leadForm.addEventListener("submit", async (event) => {

      event.preventDefault();

      const nameInput =
        document.getElementById("lead-name");

      const whatsappInput =
        document.getElementById("lead-whatsapp");

      const emailInput =
        document.getElementById("lead-email");

      const typeInput =
        document.getElementById("lead-type");


      const submitButton =
        leadForm.querySelector(
          'button[type="submit"]'
        );


      const leadError =
        document.getElementById("lead-error");


      if (leadError) {
        leadError.textContent = "";
        leadError.hidden = true;
      }


      const name =
        nameInput?.value.trim() || "";

      const whatsapp =
        whatsappInput?.value.trim() || "";

      const email =
        emailInput?.value.trim() || "";

      const userType =
        typeInput?.value.trim() || "";


      if (!name || !whatsapp || !userType) {

        if (leadError) {
          leadError.textContent =
            "Completa tu nombre, WhatsApp y tipo de usuario.";
          leadError.hidden = false;
        }

        return;
      }


      if (!lastCase || !lastDiagnosis) {

        if (leadError) {
          leadError.textContent =
            "Primero realiza el diagnóstico de tu caso.";
          leadError.hidden = false;
        }

        return;
      }


      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText =
          submitButton.textContent;

        submitButton.textContent =
          "Guardando…";
      }


      try {

        const response = await fetch("/api/lead", {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            name: name,

            whatsapp: whatsapp,

            email: email || null,

            user_type: userType,

            original_case: lastCase,

            diagnosis: JSON.stringify(lastDiagnosis),

            priority:
              getPriority(lastDiagnosis),

            origin:
              "ai-diagnosis"

          })
        });


        let data = null;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "El servidor no devolvió una respuesta válida."
          );
        }


        if (!response.ok || !data?.ok) {

          throw new Error(
            data?.error ||
            "No fue posible guardar tus datos."
          );

        }


        const leadId =
          data.lead_id;


        if (!leadId) {
          throw new Error(
            "No se recibió el identificador de la solicitud."
          );
        }


        /*
          Guardamos únicamente el ID en el navegador.
          El contenido completo permanece en D1.
        */

        sessionStorage.setItem(
          "duarte_lead_id",
          leadId
        );


        sessionStorage.setItem(
          "duarte_lead",
          JSON.stringify({
            lead_id: leadId,
            created_at: new Date().toISOString()
          })
        );


        showLeadSuccess(
          leadSection,
          leadForm,
          leadId,
          whatsapp
        );


      } catch (error) {

        console.error(
          "Error guardando lead:",
          error
        );

        if (leadError) {
          leadError.textContent =
            error?.message ||
            "No fue posible guardar tus datos. Inténtalo nuevamente.";

          leadError.hidden = false;
        }

      } finally {

        if (submitButton) {
          submitButton.disabled = false;

          submitButton.textContent =
            submitButton.dataset.originalText ||
            "Hablar con Duarte";
        }

      }

    });


    leadSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  function getPriority(diagnosis) {

    if (!diagnosis) {
      return null;
    }

    const value =
      Number(diagnosis.viabilidad);

    if (!Number.isNaN(value)) {

      if (value < 40) {
        return "urgente";
      }

      if (value < 70) {
        return "revision";
      }

      return "normal";
    }

    return null;
  }


  function showLeadSuccess(
    leadSection,
    leadForm,
    leadId,
    whatsapp
  ) {

    leadForm.innerHTML = `

      <div class="lead-success">

        <span class="result-badge">
          Solicitud registrada
        </span>

        <h3>
          Tu diagnóstico ya está en manos de Duarte.
        </h3>

        <p>
          Hemos guardado el contexto de tu evaluación
          para que no tengas que volver a explicar todo
          desde cero.
        </p>

        <p>
          <strong>ID de solicitud: ${escapeHtml(leadId)}</strong>
        </p>

        <a
          class="btn btn-primary"
          id="whatsapp-contextual"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hablar con Duarte por WhatsApp
        </a>

      </div>

    `;


    const whatsappButton =
      document.getElementById(
        "whatsapp-contextual"
      );


    if (whatsappButton) {

      const message =
        `Hola, quiero revisar con Duarte mi diagnóstico IA. ID: ${leadId}`;

      const phone =
        "5210000000000";

      whatsappButton.href =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      whatsappButton.addEventListener(
        "click",
        () => {

          /*
            El número se sustituirá por el WhatsApp
            definitivo de Duarte antes del lanzamiento.
          */

          trackEvent(
            "whatsapp_lead_click",
            {
              lead_id: leadId
            }
          );

        }
      );

    }


    leadSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  function escapeHtml(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =========================================================
     ANALÍTICA BÁSICA
  ========================================================= */

  function trackEvent(name, data = {}) {

    try {

      if (typeof window.gtag === "function") {

        window.gtag(
          "event",
          name,
          data
        );

      }

    } catch {
      /*
        La analítica nunca debe romper el sitio.
      */
    }

  }


  if (caseText) {

    caseText.addEventListener(
      "focus",
      () => {
        trackEvent(
          "diagnosis_start"
        );
      },
      {
        once: true
      }
    );

  }


  if (analyzeBtn) {

    analyzeBtn.addEventListener(
      "click",
      () => {

        trackEvent(
          "diagnosis_submit"
        );

      }
    );

  }


  /* =========================================================
     RECUPERAR DIAGNÓSTICO DE LA SESIÓN
  ========================================================= */

  try {

    const saved =
      sessionStorage.getItem(
        "duarte_diagnosis"
      );

    if (saved) {

      const parsed =
        JSON.parse(saved);

      if (
        parsed &&
        parsed.caso &&
        parsed.diagnosis
      ) {

        lastCase =
          parsed.caso;

        lastDiagnosis =
          parsed.diagnosis;

      }

    }

  } catch {
    /*
      Si sessionStorage no está disponible,
      simplemente continuamos.
    */

  }

});
