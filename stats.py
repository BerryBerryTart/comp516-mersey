import csv


def main():
    elevations = []
    chunks = {"min-3": 0,
              "03-25": 0,
              "25-50": 0,
              "50-max": 0}
    with open("r:/data.csv", "r") as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        next(reader)
        for row in reader:
            elevations.append(float(row[2]))

    print("MIN: {}".format(min(elevations)))
    print("MAX: {}".format(max(elevations)))
    for item in elevations:
        if (item <= 3):
            chunks["min-3"] = chunks["min-3"] + 1
        elif (item > 3 and item <= 25):
            chunks["03-25"] = chunks["03-25"] + 1
        elif (item > 25 and item <= 50):
            chunks["25-50"] = chunks["25-50"] + 1
        elif (item > 50):
            chunks["50-max"] = chunks["50-max"] + 1
    print(chunks)
    elevCount = len(elevations)
    print("\nmin - 3m: {:.2f}%\n3m - 25m: {:.2f}%\n25m - 50m: {:.2f}%\n50m - max: {:.2f}%".format(
          (chunks["min-3"] / elevCount) * 100,
          (chunks["03-25"] / elevCount) * 100,
          (chunks["25-50"] / elevCount) * 100,
          (chunks["50-max"] / elevCount) * 100))


if __name__ == "__main__":
    main()
