(() => {
  switch (location.host) {
    case "www.strava.com":
      let selectedData = {};

      function copyData(elt) {
        // scrape the values
        let row = elt.parentElement.parentElement.parentElement;
        let [s, m, h] = row
          .querySelector(".col-time")
          .textContent.split(":")
          .reverse();
        let time = (h || 0) * 60 + 1 * m;
        let dist = row
          .querySelector(".col-dist")
          .textContent.trim()
          .split("\n")[0];
        let date = new Date(
          row.querySelector(".col-date").textContent.split(" ")[1].split("/"),
        )
          .toISOString()
          .split("T")[0];

        // collate by same date
        if (date) {
          let existing = selectedData[date];
          if (existing) {
            selectedData[date] = {
              time: existing.time + time,
              dist: existing.dist + dist,
            };
          } else {
            selectedData[date] = {
              time,
              dist,
            };
          }
        }
      }

      // on button click
      function openCapraUrl() {
        let selected = document.querySelectorAll(".do-sync:checked");

        if (selected.length == 0) {
          alert("No activities selected to upload");
          return;
        }

        // ensure no duplicates or stale data
        selectedData = {};
        selected.forEach(copyData);

        const url =
          "https://30x30.capra.run/#" + btoa(JSON.stringify(selectedData));
        window.open(url);
      }

      // this will trigger upload
      document.querySelector(".page.container").innerHTML +=
        '<button style="position:fixed;top:5em;right:5em;" onclick="openCapraUrl()">Upload to Capra</button>';

      // inject
      // TODO this must happen AFTER activities are loaded!
      document
        .querySelectorAll("tbody .col-actions")
        .forEach(
          (x) =>
            (x.innerHTML +=
              '<label>sync to 30x30<input type="checkbox" class="do-sync"/></label>'),
        );

      break;
    case "30x30.capra.run":
      function upload() {
        const uploadData = JSON.parse(atob(window.location.hash.substr(1)));

        let i = 1;
        let promises = [];
        for (let [date, { time, dist }] of Object.entries(uploadData)) {
          promises.push(
            new Promise(function (resolve, reject) {
              setTimeout(
                () =>
                  fetch("https://30x30.capra.run/api/exercise", {
                    headers: {
                      accept: "application/json, text/plain, */*",
                      "content-type": "application/json",
                    },
                    body: `{\"minutes\":${time},\"km\":${dist || 0},\"date\":\"${date}\"}`,
                    method: "POST",
                    mode: "cors",
                    credentials: "include",
                  }).then((res) => {
                    if (res.ok) {
                      resolve(date);
                    } else {
                      alert(`There was a problem with ${date}`);
                    }
                  }),
                i * 350,
              );
            }),
          );
          i++;
          Promise.all(promises).then((res) => {
            alert("updated the following dates: " + res.join());
          });
        }
      }

      if (!location.hash) {
        alert(
          "No data to upload. Return to strava and click link to open a new window.",
        );
        return;
      } else {
        document.querySelector(
          ".MuiBox-root:first-child .MuiContainer-root",
        ).innerHTML +=
          '<button style="position:fixed;top:5em;left:1em;" onclick="openCapraUrl()">Upload to Capra</button>';
      }
      break;
    default:
      alert("only works when either on capra or strava websites");
  }
})();