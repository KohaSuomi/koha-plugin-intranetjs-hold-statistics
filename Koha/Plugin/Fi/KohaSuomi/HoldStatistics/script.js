$(document).ready(function() {
    if (/request\.pl(\b|$)/.test(window.location.href)) {
        var $existingHolds = $('#existing_holds');
        if ($existingHolds.length) {
            var params = new URLSearchParams(window.location.search);
            var biblionumber = params.get('biblionumber') || (function(){
                var m = window.location.href.match(/[?&]biblionumber=([^&]+)/);
                return m ? decodeURIComponent(m[1]) : null;
            })();
            if (biblionumber) {
                const userLang = $('html').attr('lang') || 'en'; // Default to English if language is not set
                const labels = {
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
                const lang = userLang.startsWith('sv') ? 'sv' : (userLang.startsWith('fi') ? 'fi' : 'en');
                let div = document.createElement('div');
                div.className = 'hold-statistics';
                div.innerHTML = '<div class="spinner"><img src="/intranet-tmpl/prog/img/spinner-small.gif" alt="" style="padding-right: 10px;"/><span>' + labels[lang].load + '</span></div>';
                $existingHolds.find('h2').first().after(div);
                // Fetch holds for this biblionumber with default query params
                fetchRecordHolds(biblionumber, {_per_page: -1, _match: 'exact'}).then(function(holds) {
                    var list = Array.isArray(holds) ? holds : (holds && Array.isArray(holds.holds) ? holds.holds : (holds && Array.isArray(holds.data) ? holds.data : []));
                    let activeCount = 0;
                    list.forEach(function(hold) {
                        if (hold && hold.status === null) {
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
                    $existingHolds.find('.hold-statistics').prepend(`<p>${labels[lang].suspended}: ${suspendedCount}</p>`);
                    $existingHolds.find('.hold-statistics').prepend(`<p>${labels[lang].triggered}: ${triggeredCount}</p>`);
                    $existingHolds.find('.hold-statistics').prepend(`<p>${labels[lang].active}: ${activeCount}</p>`);
                    $existingHolds.find('.hold-statistics .spinner').remove();
                });
                
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
});