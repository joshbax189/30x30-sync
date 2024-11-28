(() => {
  switch (location.host) {
    case "www.strava.com":
      globalThis.selectedData = {};

      globalThis.copyData = (elt) => {
        // scrape the values
        let row = elt.parentElement.parentElement.parentElement;
        let [s, m, h] = row
          .querySelector(".col-time")
          .textContent.split(":")
          .reverse();
        let time = (h || 0) * 60 + 1 * m;
        let dist = Number.parseFloat(
          // 10 = char code for \n, this is filtered out of the bookmark url
          row.querySelector(".col-dist").textContent.trim().split(10)[0],
        );
        let date = new Date(
          row.querySelector(".col-date").textContent.split(" ")[1].split("/"),
        )
          .toISOString()
          .split("T")[0];
        let hideDist = row.querySelector(".hide-dist")?.checked;
        dist = hideDist ? 0 : dist;

        // collate by same date
        if (date) {
          if (!date.startsWith("2024-11")) {
            alert("ignored activity " + date);
            return;
          }
          let existing = globalThis.selectedData[date];
          globalThis.selectedData[date] = {
            time: (existing?.time || 0) + time,
            dist: (existing?.dist || 0) + dist,
          };
        }
      };

      globalThis.openCapraUrl = () => {
        let selected = document.querySelectorAll(".do-sync:checked");

        if (selected.length == 0) {
          alert("No activities selected to upload");
          return;
        }

        // ensure no duplicates or stale data
        globalThis.selectedData = {};
        selected.forEach(copyData);

        const url =
          "https://30x30.capra.run/#" +
          btoa(JSON.stringify(globalThis.selectedData));
        window.open(url);
        // after opening unselect checkboxes
        document
          .querySelectorAll(".capra:checked")
          .forEach((x) => (x.checked = false));
      };

      // this will trigger upload
      document.querySelector(".page.container").innerHTML +=
        '<button style="position:fixed;top:5em;right:5em;" onclick="openCapraUrl()">Upload to Capra</button>';

      // inject
      document
        .querySelectorAll("tbody .col-actions")
        .forEach(
          (x) =>
            (x.innerHTML +=
              '<label>sync to 30x30<input type="checkbox" class="capra do-sync"/></label>' +
              '<label>hide dist<input type="checkbox" class="capra hide-dist"/></label>'),
        );

      break;
    case "30x30.capra.run":
      globalThis.upload = () => {
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
        }
        Promise.all(promises).then((res) => {
          alert("updated the following dates: " + res.join());
        });
      };

      if (!location.hash) {
        alert(
          "No data to upload. Return to strava and click link to open a new window.",
        );
        return;
      } else {
        const uploadData = JSON.parse(atob(window.location.hash.substr(1)));
        const dates = Object.keys(uploadData);
        document.querySelector(
          ".MuiBox-root:first-child .MuiContainer-root",
        ).innerHTML +=
          '<button onclick="upload()">Upload to Capra</button>' +
          `<span>${dates.join()}</span>`;
      }
      break;
    default:
      alert("only works when either on capra or strava websites");
  }
})();
