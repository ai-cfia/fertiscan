# Message for the LLM with example of Granulaine

This is the rule I want to apply on the data :

```JSON
    {
        "reference_number": "FzR: 15.(1)(i)",
        "title_en": "Organic matter",
        "title_fr": "Matière organique",
        "description_en": "The packaging of a fertilizer or organic supplement
         must indicate the percentage of organic matter and/or the moisture content.",
        "description_fr": "L’emballage d’un engrais ou d’un supplément organique
        doit indiquer le pourcentage de matière organique et/ou le taux d’humidité.",
        "url_en":
         "https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._666/index.html",
        "url_fr":
         "https://laws-lois.justice.gc.ca/fra/reglements/C.R.C.%2C_ch._666/index.html"
    }
```

This is the first part of data, the ingredient :

```JSON
    [
        {
            "laine brute de mouton" : "100%"
        },
    ]
```

This is the second part of data, guaranteed analysis :

```JSON
    {
        "Total nitrogen (N)": "10%",
        "Soluble potash (K2O)" : "4%",
        "Organic matter" : "61.5%",
        "Maximum moisture content" : "14.8%",
    }
```
