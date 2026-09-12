import { BASE_URL } from "@/api/base-url";
import { stripHtml } from "@/lib/schema";
import FaqSection from "@/components/common/faq-section";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

export default function AiaTimesFaq() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["aia-times-faq"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/getFAQbySlug/aia-times`);
      return res.data;
    },
  });

  const faqItems =
    data?.data?.map((item, index) => ({
      id: `aia-times-faq-${index + 1}`,
      question: item.faq_que,
      answer: item.faq_ans,
      heading: item.faq_heading,
      sort: item.faq_sort,
    })) || [];

  useEffect(() => {
    if (faqItems.length > 0) {
      const existingScript = document.querySelector(
        'script[type="application/ld+json"][data-faq-schema]',
      );
      if (existingScript) {
        existingScript.remove();
      }

      // Plain-text answers: Google rejects markup inside Answer.text.
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: stripHtml(item.answer),
          },
        })),
      };

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-faq-schema", "true");
      script.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(script);

      return () => {
        if (script && document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
    return undefined;
  }, [faqItems]);

  if (isLoading || isError || !faqItems.length) return null;

  return <FaqSection faqs={faqItems} />;
}
