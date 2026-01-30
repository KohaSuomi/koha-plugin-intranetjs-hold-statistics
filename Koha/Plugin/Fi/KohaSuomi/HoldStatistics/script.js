$(document).ready(function() {
    if (/request\.pl(\b|$)/.test(window.location.href)) {
        let $existingHolds = $('#existing_holds');
        if ($existingHolds.length) {
            let params = new URLSearchParams(window.location.search);
            const biblionumbers = params.getAll('biblionumber') || (function(){
                let matches = [];
                let regex = /[?&]biblionumber=([^&]+)/g;
                let match;
                while ((match = regex.exec(window.location.href)) !== null) {
                    matches.push(decodeURIComponent(match[1]));
                }
                return matches;
            })();
            let bindDiv;
            if (biblionumbers.length > 1) {
                for (let i = 0; i < biblionumbers.length; i++) {
                    bindDiv = $('#hold_title_'+biblionumbers[i]).find('h3');
                    
                    fetchAndDisplayHoldStats(biblionumbers[i], bindDiv);
                }
            } else {
                bindDiv = $existingHolds.find('h2');
                fetchAndDisplayHoldStats(biblionumbers[0], bindDiv);
            }
        }
    }
    async function fetchRecordHolds(biblionumber, queryParams={}) {
        try {
            let response = await fetch(`/api/v1/holds?biblio_id=${biblionumber}&${new URLSearchParams(queryParams)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching holds:', error);
            return [];
        }
    }
    function fetchAndDisplayHoldStats(biblionumber, bindDiv) {
        const userLang = $('html').attr('lang') || 'en'; // Default to English if language is not set
        const lang = userLang.startsWith('sv') ? 'sv' : (userLang.startsWith('fi') ? 'fi' : 'en');
        let div = document.createElement('div');
        div.className = 'hold-statistics';
        div.innerHTML = '<div class="spinner"><img src="/intranet-tmpl/prog/img/spinner-small.gif" alt="" style="padding-right: 10px;"/><span>' + holdStatisticLabels('load', lang) + '</span></div>';
        bindDiv.after(div);
        fetchRecordHolds(biblionumber, {_per_page: -1, _match: 'exact'}).then(function(holds) {
            var list = Array.isArray(holds) ? holds : (holds && Array.isArray(holds.holds) ? holds.holds : (holds && Array.isArray(holds.data) ? holds.data : []));
            let activeCount = 0;
            list.forEach(function(hold) {
                if (hold && hold.status === null && hold.suspended !== true) {
                    activeCount++;
                }
            });
            var triggeredCount = 0;
            list.forEach(function(hold) {
                if (hold && hold.status !== null) {
                    triggeredCount++;
                }
            });
            let suspendedCount = 0;
            list.forEach(function(hold) {
                if (hold && hold.suspended === true) {
                    suspendedCount++;
                }
            });
            createDivWithHoldStats(bindDiv, activeCount, triggeredCount, suspendedCount, lang);
        });
    }
    function createDivWithHoldStats(bindDiv, activeCount, triggeredCount, suspendedCount, lang) {
        const divContent = `
            <p>${holdStatisticLabels('active', lang)}: ${activeCount}</p>
            <p>${holdStatisticLabels('triggered', lang)}: ${triggeredCount}</p>
            <p>${holdStatisticLabels('suspended', lang)}: ${suspendedCount}</p>
        `;
        $(bindDiv).next('.hold-statistics').append(divContent);
        $(bindDiv).next('.hold-statistics').find('.spinner').remove();
    }
    function holdStatisticLabels(label, lang) {
        const translations = {
            fi: {
                active: 'Aktiiviset',
                triggered: 'Kiinni jääneet',
                suspended: 'Ei aktiiviset',
                load: 'Ladataan...'
            },
            sv: {
                active: 'Aktiva',
                triggered: 'I transport / väntade',
                suspended: 'Inaktiva',
                load: 'Laddar...'
            },
            en: {
                active: 'Active',
                triggered: 'Triggered',
                suspended: 'Inactive',
                load: 'Loading...'
            }
        };
        return translations[lang] && translations[lang][label] ? translations[lang][label] : label;
    }
});