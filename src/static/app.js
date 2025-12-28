document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      
      // Clear dropdown options except the first placeholder option
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build activity card content safely using DOM methods to avoid XSS
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;
        activityCard.appendChild(titleEl);

        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = details.description;
        activityCard.appendChild(descriptionEl);

        const scheduleEl = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule:";
        scheduleEl.appendChild(scheduleLabel);
        scheduleEl.appendChild(document.createTextNode(" " + details.schedule));
        activityCard.appendChild(scheduleEl);

        const availabilityEl = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability:";
        availabilityEl.appendChild(availabilityLabel);
        availabilityEl.appendChild(document.createTextNode(" " + spotsLeft + " spots left"));
        activityCard.appendChild(availabilityEl);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants:";
        participantsSection.appendChild(participantsHeader);

        if (details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((email) => {
            const li = document.createElement("li");

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;
            li.appendChild(emailSpan);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.dataset.activity = name;
            deleteBtn.dataset.email = email;
            deleteBtn.title = "Remove participant";
            deleteBtn.textContent = "🗑️";
            li.appendChild(deleteBtn);

            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "No participants yet";
          participantsSection.appendChild(noParticipants);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participant list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle delete button clicks
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const activityName = event.target.dataset.activity;
      const email = event.target.dataset.email;

      if (confirm(`Are you sure you want to unregister ${email} from ${activityName}?`)) {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();

          if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = "success";
            messageDiv.classList.remove("hidden");
            // Refresh activities to show updated participant list
            fetchActivities();

            // Hide message after 5 seconds
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          } else {
            messageDiv.textContent = result.detail || "An error occurred";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
          }
        } catch (error) {
          messageDiv.textContent = "Failed to unregister. Please try again.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering:", error);
        }
      }
    }
  });

  // Initialize app
  fetchActivities();
});
