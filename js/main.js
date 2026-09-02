/* =========================================================
   DUARTE LEGAL
   Main JavaScript
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     MOBILE NAVIGATION
     ======================================================= */

  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

      const isOpen = mainNav.classList.toggle("active");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

      menuToggle.textContent = isOpen ? "✕" : "☰";
    });


    mainNav.querySelectorAll("a").forEach(link => {

      link.addEventListener("click", () => {

        mainNav.classList.remove("active");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        menuToggle.textContent = "☰";
      });

    });

  }


  /* =======================================================
     SCROLL REVEAL
     ======================================================= */

  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {

    const revealObserver = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            revealObserver.unobserve(entry.target);

          }

        });

      },
      {
        threshold: 0.12
      }
    );


    revealElements.forEach(element => {
      revealObserver.observe(element);
    });

  } else {

    revealElements.forEach(element => {
      element.classList.add("visible");
    });

  }


  /* =======================================================
     AI DIAGNOSIS
     ======================================================= */

  const diagnosisForm = document.getElementById("diag-form");
  const caseText = document.getElementById("case-text");
  const analyzeButton = document.getElementById("analyze-btn");

  const statusLabel = document.getElementById("status-label");
  const errorBox = document.getElementById("diag-error");

  const resultBox = document.getElementById("diag-result");

  const gaugeArc = document.getElementById("gauge-arc");
  const gaugeText = document.getElementById("gauge-text");

  const resultTitle = document.getElementById("result-title");
  const resultBadge = document.getElementById("result-badge");
  const resultSummary = document.getElementById("result-summary");

  const resultFactors = document.getElementById("result-factors");
  const resultNext = document.getElementById("result-next");

  const continuar = document.getElementById("continuar");
  const leadForm = document.getElementById("lead-form");


  let currentDiagnosis = null;
  let currentLeadId = null;


  if (diagnosisForm) {

    diagnosisForm.addEventListener("submit", async event => {

      event.preventDefault();

      const text = caseText.value.trim();

      /* ---------------------------------------------------
         VALIDATION
         --------------------------------------------------- */

      if (!text) {

        showError(
          "Cuéntanos brevemente qué está ocurriendo antes de analizar tu caso."
        );

        return;
      }


      if (text.length < 20) {

        showError(
          "Necesitamos un poco más de contexto para realizar una evaluación útil."
        );

        return;
      }


      /* ---------------------------------------------------
         RESET UI
         --------------------------------------------------- */

      hideError();

      resultBox.style.display = "none";

      if (continuar) {
        continuar.hidden = true;
      }

      setLoadingState(true);


      try {

        /* -------------------------------------------------
           API REQUEST

           El backend actual espera "caso".
           Conservamos también "case" y "query" para
           compatibilidad futura.
           ------------------------------------------------- */

        const response = await fetch("/api/analyze", {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            caso: text,
            case: text,
            query: text
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


        if (!data) {

          throw new Error(
            "No se recibió información del diagnóstico."
          );

        }


        /* -------------------------------------------------
           SAVE CURRENT DIAGNOSIS
           ------------------------------------------------- */

        currentDiagnosis = {
          query: text,
          result: data,
          date: new Date().toISOString()
        };


        try {

          sessionStorage.setItem(
            "duarte_diagnosis",
            JSON.stringify(currentDiagnosis)
          );

        } catch (storageError) {

          console.warn(
            "No fue posible guardar el diagnóstico localmente.",
            storageError
          );

        }


        /* -------------------------------------------------
           RENDER RESULT
           ------------------------------------------------- */

        renderDiagnosis(data);

        resultBox.style.display = "block";


        /* -------------------------------------------------
           SHOW LEAD CAPTURE
           ------------------------------------------------- */

        if (continuar) {

          continuar.hidden = false;

          setTimeout(() => {

            continuar.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }, 250);

        }


      } catch (error) {

        console.error("Duarte Diagnosis Error:", error);

        showError(
          error.message ||
          "Ocurrió un error al analizar tu caso. Inténtalo nuevamente."
        );

      } finally {

        setLoadingState(false);

      }

    });

  }


  /* =======================================================
     LOADING STATE
     ======================================================= */

  function setLoadingState(isLoading) {

    if (!analyzeButton) {
      return;
    }


    analyzeButton.disabled = isLoading;


    if (isLoading) {

      analyzeButton.dataset.originalText =
        analyzeButton.textContent;

      analyzeButton.textContent =
        "Analizando...";

      if (statusLabel) {

        statusLabel.textContent =
          "Estamos revisando los elementos principales de tu caso...";

      }

    } else {

      analyzeButton.textContent =
        analyzeButton.dataset.originalText ||
        "Analizar mi caso";

      if (statusLabel) {

        statusLabel.textContent =
          "Tu información será analizada para generar una evaluación preliminar.";

      }

    }

  }


  /* =======================================================
     RENDER DIAGNOSIS
     ======================================================= */

  function renderDiagnosis(data) {

    const viability = normalizeViability(
      data.viabilidad
    );


    /* -----------------------------------------------------
       GAUGE
       ----------------------------------------------------- */

    if (gaugeArc) {

      const circumference = 440;

      const offset =
        circumference -
        (circumference * viability / 100);

      gaugeArc.style.strokeDashoffset = offset;

    }


    if (gaugeText) {

      gaugeText.textContent =
        `${viability}%`;

    }


    /* -----------------------------------------------------
       TITLE
       ----------------------------------------------------- */

    if (resultTitle) {

      resultTitle.textContent =
        data.titulo ||
        data.title ||
        "Evaluación preliminar";

    }


    /* -----------------------------------------------------
       BADGE
       ----------------------------------------------------- */

    if (resultBadge) {

      resultBadge.textContent =
        getBadgeText(viability);

    }


    /* -----------------------------------------------------
       SUMMARY
       ----------------------------------------------------- */

    if (resultSummary) {

      resultSummary.textContent =
        data.resumen ||
        data.summary ||
        "La evaluación identifica elementos que conviene revisar con mayor detalle.";

    }


    /* -----------------------------------------------------
       FACTORS
       ----------------------------------------------------- */

    if (resultFactors) {

      resultFactors.innerHTML = "";

      const heading = document.createElement("h4");

      heading.textContent =
        "Lo que identificamos";

      resultFactors.appendChild(heading);


      const content =
        data.factores ||
        data.factors ||
        data.identificado ||
        data.identificados;


      appendFlexibleContent(
        resultFactors,
        content
      );

    }


    /* -----------------------------------------------------
       NEXT STEP
       ----------------------------------------------------- */

    if (resultNext) {

      resultNext.innerHTML = "";

      const heading = document.createElement("h4");

      heading.textContent =
        "Siguiente paso";

      resultNext.appendChild(heading);


      const content =
        data.siguiente_paso ||
        data.next_step ||
        data.next ||
        "Conviene revisar el caso con mayor información antes de tomar una decisión.";

      appendFlexibleContent(
        resultNext,
        content
      );

    }

  }


  /* =======================================================
     FLEXIBLE CONTENT
     ======================================================= */

  function appendFlexibleContent(container, content) {

    if (!content) {

      const paragraph =
        document.createElement("p");

      paragraph.textContent =
        "No hay información suficiente para desarrollar este punto.";

      container.appendChild(paragraph);

      return;
    }


    if (Array.isArray(content)) {

      const list =
        document.createElement("ul");

      content.forEach(item => {

        const li =
          document.createElement("li");

        li.textContent =
          typeof item === "string"
            ? item
            : JSON.stringify(item);

        list.appendChild(li);

      });

      container.appendChild(list);

      return;
    }


    if (typeof content === "object") {

      const list =
        document.createElement("ul");

      Object.entries(content).forEach(
        ([key, value]) => {

          const li =
            document.createElement("li");

          const label =
            document.createElement("strong");

          label.textContent =
            `${key}: `;

          li.appendChild(label);

          li.appendChild(
            document.createTextNode(
              typeof value === "string"
                ? value
                : JSON.stringify(value)
            )
          );

          list.appendChild(li);

        }
      );

      container.appendChild(list);

      return;
    }


    const paragraph =
      document.createElement("p");

    paragraph.textContent =
      String(content);

    container.appendChild(paragraph);

  }


  /* =======================================================
     VIABILITY
     ======================================================= */

  function normalizeViability(value) {

    let number =
      Number(value);

    if (Number.isNaN(number)) {

      const text =
        String(value || "")
          .toLowerCase();

      if (
        text.includes("alta") ||
        text.includes("favorable") ||
        text.includes("favorable")
      ) {
        return 80;
      }

      if (
        text.includes("media") ||
        text.includes("moderada")
      ) {
        return 55;
      }

      if (
        text.includes("baja") ||
        text.includes("desfavorable")
      ) {
        return 30;
      }

      return 50;
    }


    if (number <= 1) {
      number = number * 100;
    }


    return Math.max(
      0,
      Math.min(100, Math.round(number))
    );

  }


  function getBadgeText(value) {

    if (value >= 70) {
      return "Perspectiva favorable";
    }

    if (value >= 40) {
      return "Requiere revisión";
    }

    return "Atención prioritaria";

  }


  /* =======================================================
     ERROR HANDLING
     ======================================================= */

  function showError(message) {

    if (!errorBox) {
      return;
    }

    errorBox.textContent =
      message;

    errorBox.style.display =
      "block";

  }


  function hideError() {

    if (!errorBox) {
      return;
    }

    errorBox.textContent = "";

    errorBox.style.display =
      "none";

  }


  /* =======================================================
     LEAD CAPTURE
     ======================================================= */

  if (leadForm) {

    leadForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const name =
          document.getElementById("lead-name")?.value.trim();

        const whatsapp =
          document.getElementById("lead-whatsapp")?.value.trim();

        const email =
          document.getElementById("lead-email")?.value.trim();

        const type =
          document.getElementById("lead-type")?.value;


        if (!name || !whatsapp || !type) {

          alert(
            "Por favor completa tu nombre, WhatsApp y tipo de usuario."
          );

          return;

        }


        /* -------------------------------------------------
           LEAD ID

           Esta versión genera el identificador en el
           navegador. La conexión con base de datos/CRM
           corresponde a la siguiente integración.
           ------------------------------------------------- */

        currentLeadId =
          generateLeadId();


        const lead = {

          id: currentLeadId,

          name,

          whatsapp,

          email: email || null,

          type,

          original_case:
            currentDiagnosis?.query || caseText?.value || "",

          diagnosis:
            currentDiagnosis?.result || null,

          created_at:
            new Date().toISOString(),

          origin:
            "diagnostico_ia"

        };


        try {

          sessionStorage.setItem(
            "duarte_lead",
            JSON.stringify(lead)
          );

        } catch (storageError) {

          console.warn(
            "No fue posible guardar el lead localmente.",
            storageError
          );

        }


        /* -------------------------------------------------
           WHATSAPP

           No mandamos el contenido jurídico completo.
           Mandamos únicamente el ID para recuperar el
           contexto posteriormente.
           ------------------------------------------------- */

        const phone =
          "526461510992";


        const message =
          `Hola, quiero revisar con Duarte mi diagnóstico IA. ID: ${currentLeadId}`;


        const whatsappUrl =
          `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;


        window.open(
          whatsappUrl,
          "_blank",
          "noopener"
        );

      }

    );

  }


  /* =======================================================
     LEAD ID
     ======================================================= */

  function generateLeadId() {

    const random =
      Math.floor(
        10000 +
        Math.random() * 90000
      );

    return `DL-${random}`;

  }

});
